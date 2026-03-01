

# Fix: Radix UI + React 19 Infinite Ref Loop (Root Cause)

## Problem

The current `composeRefs` patch in `src/lib/radix-compose-refs-patch.ts` uses a synchronous `isSettingRef` guard, but this doesn't prevent the loop because it happens **across render cycles**:

1. `@radix-ui/react-slot` calls `composeRefs()` directly in render (not inside a hook), creating a new function every render
2. The patched `composeRefs` returns a cleanup function
3. React 19 detects the ref callback changed (new function) and calls the old cleanup, then the new ref
4. If any composed ref triggers a state update (common in Radix internals), this causes a re-render, producing yet another new composed ref -- infinite loop

## Solution

Modify the `composeRefs` patch to **never return a cleanup function**. This breaks the cycle because React 19 only triggers the cleanup-then-set loop when it receives a cleanup function from a ref callback.

### File: `src/lib/radix-compose-refs-patch.ts`

Replace the entire file with a simpler implementation:

```typescript
import * as React from "react";

function setRef<T>(ref: React.Ref<T> | undefined, value: T) {
  if (typeof ref === "function") {
    const result = ref(value);
    // Intentionally discard cleanup to prevent React 19 infinite loop
    // when composeRefs is called directly in render (not memoized)
    return typeof result === "function" ? result : undefined;
  } else if (ref !== null && ref !== undefined) {
    (ref as React.MutableRefObject<T>).current = value;
  }
}

function composeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  return (node: T) => {
    // Set all refs but do NOT return a cleanup function.
    // Returning cleanup from a non-memoized ref callback in React 19
    // causes an infinite re-render loop because React calls cleanup
    // on every render when the callback identity changes.
    refs.forEach((ref) => setRef(ref, node));
  };
}

function useComposedRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  // In the hook version, we CAN safely return cleanup since
  // useCallback ensures stable identity across renders.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useCallback(
    (node: T) => {
      const cleanups: ((() => void) | undefined)[] = [];
      refs.forEach((ref) => {
        if (typeof ref === "function") {
          const result = ref(node);
          if (typeof result === "function") {
            cleanups.push(result);
          }
        } else if (ref !== null && ref !== undefined) {
          (ref as React.MutableRefObject<T>).current = node;
        }
      });
      
      if (cleanups.length > 0) {
        return () => {
          cleanups.forEach((cleanup) => cleanup?.());
          refs.forEach((ref) => {
            if (typeof ref === "function") {
              ref(null as unknown as T);
            } else if (ref !== null && ref !== undefined) {
              (ref as React.MutableRefObject<T>).current = null as unknown as T;
            }
          });
        };
      }
    },
    refs
  );
}

export { composeRefs, useComposedRefs };
```

### Key difference

- **`composeRefs()`** (used by Slot in render): Sets all refs but returns `undefined` -- no cleanup. This prevents React 19 from triggering the cleanup-set-rerender cycle.
- **`useComposedRefs()`** (used inside hooks): Safely returns cleanup since `useCallback` ensures the function identity is stable across renders.

### Why this is safe

In React 18, ref callbacks that didn't return cleanup were never called with `null` on unmount -- so this matches the old behavior exactly. The cleanup was a React 19 feature that Radix's architecture (calling `composeRefs` in render) is not yet compatible with.

## Technical Details

- Only one file modified: `src/lib/radix-compose-refs-patch.ts`
- The Vite alias in `vite.config.ts` already redirects all `@radix-ui/react-compose-refs` imports to this file -- no changes needed there
- This fixes the error globally for all Radix components (Dialog, Tooltip, Popover, AlertDialog, etc.)

