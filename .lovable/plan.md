

# Fix: Dropdown menus not opening due to over-aggressive re-entrancy guard

## Problem

The `isComposing` global flag in the compose-refs patch blocks ALL re-entrant ref calls. However, Radix components legitimately nest composed refs (e.g., DropdownMenu > MenuContent > Popper > PopperContent all compose refs). When a parent ref callback triggers a child composed ref callback, the guard blocks it, so inner components never receive their DOM node references and cannot render or position themselves.

Result: no errors, but menus silently fail to open.

## Root Cause

The original infinite loop was caused by React 19's ref cleanup return mechanism creating recursive `setState` calls. The fix (blocking all re-entrancy) is too aggressive -- it also blocks the legitimate nested ref patterns that Radix relies on.

## Solution

Simplify the patch to **not return cleanup functions at all**. When a ref callback doesn't return a cleanup function, React 19 falls back to the legacy behavior (calling the ref with `null` on unmount). This:
1. Eliminates the infinite loop (no cleanup chain to recurse through)
2. Allows nested ref composition to work normally (no re-entrancy guard needed)
3. Keeps the same mounting behavior (refs still get set correctly)

### Updated `src/lib/radix-compose-refs-patch.ts`

```ts
import * as React from "react";

type PossibleRef<T> = React.Ref<T> | undefined | null;

function setRef<T>(ref: PossibleRef<T>, value: T | null) {
  if (typeof ref === "function") {
    ref(value);
    // Intentionally NOT returning cleanup to avoid React 19 infinite loop
  } else if (ref !== null && ref !== undefined) {
    (ref as React.MutableRefObject<T | null>).current = value;
  }
}

function composeRefs<T>(...refs: PossibleRef<T>[]): React.RefCallback<T> {
  return (node: T | null) => {
    refs.forEach((ref) => setRef(ref, node));
    // No cleanup return -- React 19 will call with null on unmount instead
  };
}

function useComposedRefs<T>(...refs: PossibleRef<T>[]) {
  return React.useCallback(composeRefs(...refs), refs);
}

export { composeRefs, useComposedRefs };
```

No changes needed to `vite.config.ts` -- the alias and exclude configuration is already correct.

## Files to modify

| File | Change |
|------|--------|
| `src/lib/radix-compose-refs-patch.ts` | Remove re-entrancy guard and cleanup return; use simple fire-and-forget ref assignment |

## Why this works

- **No infinite loop**: The loop was caused by cleanup functions triggering new ref assignments. Without cleanup returns, React 19 falls back to calling the ref callback with `null` on unmount -- the same behavior as React 18.
- **Nested refs work**: Without the `isComposing` guard, parent and child composed refs can both execute normally.
- **No side effects**: Ref cleanup via `null` call is functionally equivalent to explicit cleanup for Radix's use case (DOM node references).

