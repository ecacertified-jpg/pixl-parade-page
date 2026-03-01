

# Fix: Infinite loop caused by unmemoized `composeRefs` in `@radix-ui/react-slot`

## The Real Root Cause (Finally!)

After extensive investigation, the true source of the infinite loop is **not** in `@radix-ui/react-compose-refs` itself, but in how `@radix-ui/react-slot` **uses** it.

In `SlotClone` (line 38 of `react-slot/dist/index.mjs`):
```ts
props2.ref = forwardedRef ? composeRefs(forwardedRef, childrenRef) : childrenRef;
```

This calls `composeRefs()` **directly during render** (not memoized), creating a **new function ref every render**. In React 19:
1. React sees a new ref callback on re-render
2. It unmounts the old ref (calls with `null`) and mounts the new one (calls with `node`)
3. Calling the ref triggers `dispatchSetState` internally
4. This causes a re-render, going back to step 1 -- infinite loop

This is a **known Radix bug** (GitHub issue [#3799](https://github.com/radix-ui/primitives/issues/3799), fix PR [#3804](https://github.com/radix-ui/primitives/pull/3804)) that hasn't been released yet in v1.2.3.

## Why previous patches failed

- Patching only `compose-refs` can't fix this -- the problem is that `SlotClone` calls `composeRefs` (not `useComposedRefs`) in render, so the result is never memoized
- The re-entrancy guard blocked legitimate nested refs, breaking menus
- The "no cleanup" approach still loops because the new-callback-every-render triggers React 19's ref lifecycle

## Solution

Patch `@radix-ui/react-slot` via Vite alias to use `useComposedRefs` (memoized) instead of `composeRefs` (unmemoized) in `SlotClone`. This is exactly the fix from PR #3804.

### Files to modify

| File | Change |
|------|--------|
| `src/lib/radix-slot-patch.tsx` | **New file** -- Patched copy of `@radix-ui/react-slot` that uses `useComposedRefs` in `SlotClone` |
| `src/lib/radix-compose-refs-patch.ts` | Restore cleanup support (original API) since the infinite loop is now prevented at the slot level |
| `vite.config.ts` | Add alias for `@radix-ui/react-slot` pointing to the patch; keep the `compose-refs` alias and exclude both from pre-bundling |

### 1. `src/lib/radix-slot-patch.tsx` (new)

A patched copy of `@radix-ui/react-slot` where `SlotClone` uses a custom hook with `useComposedRefs` to memoize the composed ref, instead of calling `composeRefs` inline during render.

Key change in `SlotClone`:
```tsx
// BEFORE (broken with React 19):
props2.ref = forwardedRef ? composeRefs(forwardedRef, childrenRef) : childrenRef;

// AFTER (memoized):
const composedRef = useComposedRefs(forwardedRef, childrenRef);
props2.ref = forwardedRef ? composedRef : childrenRef;
```

### 2. `src/lib/radix-compose-refs-patch.ts` (update)

Restore the original API with cleanup support. The infinite loop is now prevented because `SlotClone` no longer creates a new ref callback every render:

```ts
function setRef(ref, value) {
  if (typeof ref === "function") {
    return ref(value); // Return cleanup for React 19
  } else if (ref !== null && ref !== undefined) {
    ref.current = value;
  }
}

function composeRefs(...refs) {
  return (node) => {
    let hasCleanup = false;
    const cleanups = refs.map((ref) => {
      const cleanup = setRef(ref, node);
      if (!hasCleanup && typeof cleanup === "function") hasCleanup = true;
      return cleanup;
    });
    if (hasCleanup) {
      return () => {
        for (let i = 0; i < cleanups.length; i++) {
          const cleanup = cleanups[i];
          typeof cleanup === "function" ? cleanup() : setRef(refs[i], null);
        }
      };
    }
  };
}

function useComposedRefs(...refs) {
  return React.useCallback(composeRefs(...refs), refs);
}
```

### 3. `vite.config.ts` (update)

```ts
resolve: {
  alias: {
    "@": path.resolve(__dirname, "./src"),
    "react": ...,
    "@radix-ui/react-compose-refs": path.resolve(__dirname, "./src/lib/radix-compose-refs-patch.ts"),
    "@radix-ui/react-slot": path.resolve(__dirname, "./src/lib/radix-slot-patch.tsx"),  // NEW
  },
},
optimizeDeps: {
  exclude: [
    '@radix-ui/react-compose-refs',
    '@radix-ui/react-slot',  // NEW
  ],
}
```

## Why this will work

- `SlotClone` is a `forwardRef` component, so hooks like `useComposedRefs` work inside it
- `useComposedRefs` uses `useCallback` to return a **stable** ref callback
- A stable ref callback means React 19 doesn't unmount/remount the ref on every render
- No new ref every render = no infinite `dispatchSetState` loop
- All nested Radix components (dropdowns, dialogs, tooltips) pass through `Slot`, so this fixes everything

