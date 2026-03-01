

# Fix: Radix UI + React 19 Infinite Loop (Node-Based Guard)

## Root Cause

The current patch uses a `WeakMap<Function, object>` to track which ref was last called with which node. This fails because:
- `composeRefs()` is called during render (line 38 of `@radix-ui/react-slot`)
- The inner refs (`forwardedRef`, `childrenRef`) are **new closure instances** each render
- So the WeakMap never finds a match -- the key (ref function) is always new

The loop is **synchronous**: `ref(node)` -> `dispatchSetState` -> re-render -> new `composeRefs` call -> `ref(node)` -> `dispatchSetState` -> ...

## Solution

Replace the WeakMap approach with a **`WeakSet` re-entrancy guard on the DOM node**:
- Before calling inner refs, check if we're already processing this node
- If yes, skip (breaks the loop)
- If no, add the node to the guard, call refs, then schedule cleanup via microtask

This works because the entire loop is synchronous within React's commit phase.

## Changes

### File: `src/lib/radix-compose-refs-patch.ts` (rewrite)

```typescript
import * as React from "react";

// Re-entrancy guard: tracks DOM nodes currently being processed
// to break synchronous infinite loops in React 19's commit phase.
const processingNodes = new WeakSet<object>();

function setRef<T>(ref: React.Ref<T> | undefined, value: T) {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref !== null && ref !== undefined) {
    (ref as React.MutableRefObject<T>).current = value;
  }
}

function composeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  return (node: T) => {
    // Guard: if this node is already being processed by a
    // composeRefs call higher in the synchronous call stack,
    // skip to break the infinite setState loop.
    if (node != null && typeof node === "object") {
      if (processingNodes.has(node as object)) return;
      processingNodes.add(node as object);
      refs.forEach((ref) => setRef(ref, node));
      // Clear after microtask so future legitimate updates work
      Promise.resolve().then(() => {
        processingNodes.delete(node as object);
      });
    } else {
      refs.forEach((ref) => setRef(ref, node));
    }
  };
}

function useComposedRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  return React.useCallback(composeRefs(...refs), refs);
}

export { composeRefs, useComposedRefs };
```

### Key differences from previous approach
- **WeakSet on node** instead of WeakMap on ref function -- correctly handles new closures each render
- **Synchronous guard** -- the loop is synchronous so this reliably breaks it
- **Microtask cleanup** -- allows future legitimate ref updates after the current commit
- **Simplified `useComposedRefs`** -- delegates to `composeRefs` since the guard handles everything
- **No cleanup function returned** -- prevents React 19 cleanup-set cycles

