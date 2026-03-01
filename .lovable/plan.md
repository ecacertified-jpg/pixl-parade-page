

# Fix: Radix UI menus not opening -- replace patching strategy

## Problem

The current approach excludes ALL Radix UI packages from Vite's pre-bundling (`optimizeDeps.exclude`). This causes cascading issues:
- CommonJS dependencies like `use-sync-external-store` fail to load as ESM
- Module resolution breaks silently, causing menus not to open
- Each fix creates a new problem (whack-a-mole)

## Solution: Vite plugin instead of alias + exclude

Replace the alias + exclude strategy with a **custom Vite plugin** that intercepts the `compose-refs` module during the `load` phase. This works **during pre-bundling**, so all Radix packages can remain normally bundled.

### Changes

**1. Update `src/lib/radix-compose-refs-patch.ts`**

Rewrite to match the original module's API more closely (using `useCallback` instead of `useMemo`, proper cleanup return), but with a re-entrancy guard to prevent the infinite loop:

```ts
import * as React from "react";

let isComposing = false;

function setRef(ref, value) {
  if (typeof ref === "function") {
    return ref(value);
  } else if (ref !== null && ref !== undefined) {
    ref.current = value;
  }
}

function composeRefs(...refs) {
  return (node) => {
    if (isComposing) return;
    isComposing = true;
    try {
      let hasCleanup = false;
      const cleanups = refs.map((ref) => {
        const cleanup = setRef(ref, node);
        if (!hasCleanup && typeof cleanup === "function") {
          hasCleanup = true;
        }
        return cleanup;
      });
      if (hasCleanup) {
        return () => {
          if (isComposing) return;
          isComposing = true;
          try {
            for (let i = 0; i < cleanups.length; i++) {
              const cleanup = cleanups[i];
              if (typeof cleanup === "function") {
                cleanup();
              } else {
                setRef(refs[i], null);
              }
            }
          } finally {
            isComposing = false;
          }
        };
      }
    } finally {
      isComposing = false;
    }
  };
}

function useComposedRefs(...refs) {
  return React.useCallback(composeRefs(...refs), refs);
}

export { composeRefs, useComposedRefs };
```

**2. Rewrite `vite.config.ts` optimizeDeps**

- Remove ALL `@radix-ui/*` entries from `optimizeDeps.exclude` (keep only `@radix-ui/react-compose-refs`)
- Remove the `use-sync-external-store` entries from `optimizeDeps.include` (no longer needed)
- Keep the `resolve.alias` for `@radix-ui/react-compose-refs` pointing to the patch file

This restores normal Radix pre-bundling while the alias still redirects compose-refs to our safe implementation.

## Files to modify

| File | Change |
|------|--------|
| `src/lib/radix-compose-refs-patch.ts` | Rewrite to match original API with re-entrancy guard on both set and cleanup |
| `vite.config.ts` | Remove all Radix excludes except compose-refs; remove use-sync-external-store includes |

## Expected result

All Radix-based menus (profile dropdown, dialogs, tooltips, popovers) will open correctly without infinite loops or module resolution errors.

