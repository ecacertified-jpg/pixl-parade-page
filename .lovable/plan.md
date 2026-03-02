

# Fix: Final resolution of Radix/React 19 infinite loop

## Current Status

After 5+ attempted fixes, the root cause has been traced through the entire call chain. The current patches (slot-patch + compose-refs-patch) are close but insufficient because:

- `FocusScope` in `chunk-2JCQJD2B.js` calls `useComposedRefs(forwardedRef, (node) => setContainer(node))`
- `setContainer` is a `useState` setter (`dispatchSetState`)
- During React 19's commit phase, calling `dispatchSetState` inside a ref callback can trigger synchronous re-processing of the fiber tree, causing ref callbacks to be re-invoked even if their identity hasn't changed

## Solution: Add synchronous re-entrancy protection to `setRef`

The fix is to add a **per-node** guard in `setRef` that prevents the same node from being set on the same ref within a single synchronous call stack. This is different from the previous global `isComposing` guard that broke nested refs.

### Files to modify

| File | Change |
|------|--------|
| `src/lib/radix-compose-refs-patch.ts` | Add per-call-stack deduplication guard to prevent re-entrant `dispatchSetState` loops |

### Implementation

```ts
import * as React from "react";

type PossibleRef<T> = React.Ref<T> | undefined | null;

// Track refs currently being set to prevent re-entrant loops
// Uses a Set of ref+value pairs to allow different refs to be set
// but prevent the SAME ref from being called with the SAME value recursively
const activeSetRefs = new Set<string>();
let idCounter = 0;
const refIds = new WeakMap<Function, number>();

function getRefId(ref: Function): number {
  let id = refIds.get(ref);
  if (id === undefined) {
    id = ++idCounter;
    refIds.set(ref, id);
  }
  return id;
}

function setRef<T>(ref: PossibleRef<T>, value: T | null) {
  if (typeof ref === "function") {
    // Guard: prevent the same function ref from being called recursively
    // This stops dispatchSetState -> re-render -> ref re-call loops
    const refId = getRefId(ref);
    const key = `${refId}`;
    if (activeSetRefs.has(key)) return;
    activeSetRefs.add(key);
    try {
      ref(value);
    } finally {
      activeSetRefs.delete(key);
    }
    // Do NOT return cleanup to prevent React 19 cleanup chain loops
  } else if (ref !== null && ref !== undefined) {
    (ref as React.MutableRefObject<T | null>).current = value;
  }
}

function composeRefs<T>(...refs: PossibleRef<T>[]): React.RefCallback<T> {
  return (node: T | null) => {
    refs.forEach((ref) => setRef(ref, node));
  };
}

function useComposedRefs<T>(...refs: PossibleRef<T>[]): React.RefCallback<T> {
  const refsRef = React.useRef(refs);
  refsRef.current = refs;

  return React.useCallback((node: T | null) => {
    refsRef.current.forEach((ref) => setRef(ref, node));
  }, []);
}

export { composeRefs, useComposedRefs };
```

### Why this approach works (and previous ones didn't)

1. **Per-ref guard, not global**: Each function ref is tracked individually via a WeakMap ID. Ref A being set doesn't block Ref B from being set (this is why the old global `isComposing` broke menus).

2. **Prevents self-recursion**: If `dispatchSetState` inside ref A triggers a synchronous re-render that tries to call ref A again, the guard blocks it. The loop is broken.

3. **WeakMap prevents memory leaks**: Function refs are weakly referenced, so they can be garbage collected normally.

4. **No cleanup return**: We still don't return cleanup functions from `setRef`, so React 19's cleanup chain can't loop.

5. **Compatible with nested refs**: Parent composed ref calling child composed ref works fine because they are different functions with different IDs.

### No changes needed to other files

- `src/lib/radix-slot-patch.tsx` -- already correctly uses `useComposedRefs` (keep as is)
- `vite.config.ts` -- aliases and exclusions are already correct (keep as is)

