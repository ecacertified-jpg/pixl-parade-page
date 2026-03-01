

# Fix: Profile Dropdown Not Opening (Re-entrancy Guard Too Aggressive)

## Root Cause

The current `WeakSet` guard in `radix-compose-refs-patch.ts` blocks ALL subsequent ref calls for the same DOM node within a microtask. This successfully prevents the infinite loop crash, but also prevents the **second legitimate call** that Radix needs to properly initialize dropdown content (positioning, focus management, etc.).

The sequence is:
1. User clicks profile icon -> Radix opens dropdown -> new DOM nodes created
2. `composeRefs` ref callback called with node -> node added to WeakSet -> refs set -> one ref triggers `setState`
3. React re-renders -> creates new `composeRefs` callback -> React calls old(null) + new(node)
4. **new(node)**: node is still in WeakSet (microtask hasn't cleared) -> **SKIPPED** -- dropdown refs never fully initialized -> dropdown doesn't appear

## Solution

Replace the boolean WeakSet with a **depth counter** (`WeakMap<object, number>`). Allow up to 2 ref calls per node per microtask (initial + one re-entry from setState), but block at 3+ to prevent the infinite loop (React's limit is 50).

This allows the necessary ref updates for dropdown functionality while still breaking the runaway loop.

## Changes

### File: `src/lib/radix-compose-refs-patch.ts`

Replace the entire file:

```typescript
import * as React from "react";

// Depth counter per DOM node: allows a small number of re-entrant
// ref calls (needed for Radix internals) but caps them to prevent
// the infinite setState loop in React 19.
const nodeCallCount = new WeakMap<object, number>();
const MAX_CALLS_PER_TICK = 3;

function setRef<T>(ref: React.Ref<T> | undefined, value: T) {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref !== null && ref !== undefined) {
    (ref as React.MutableRefObject<T>).current = value;
  }
}

function composeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  return (node: T) => {
    if (node != null && typeof node === "object") {
      const count = nodeCallCount.get(node as object) || 0;
      if (count >= MAX_CALLS_PER_TICK) return; // Break infinite loop
      nodeCallCount.set(node as object, count + 1);

      refs.forEach((ref) => setRef(ref, node));

      // Reset after microtask so future legitimate updates work
      if (count === 0) {
        Promise.resolve().then(() => {
          nodeCallCount.delete(node as object);
        });
      }
    } else {
      refs.forEach((ref) => setRef(ref, node));
    }
    // Do NOT return a cleanup function -- prevents React 19
    // cleanup-then-set cycle when callback identity changes each render.
  };
}

function useComposedRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useCallback(composeRefs(...refs), refs);
}

export { composeRefs, useComposedRefs };
```

### Key differences from previous approach

- **WeakMap counter** instead of WeakSet boolean -- allows 1-2 re-entries (needed by Radix) but blocks at 3+ (infinite loop)
- **Single microtask cleanup** -- only the first call schedules the cleanup to avoid redundant promises
- **No cleanup function returned** -- still prevents React 19's cleanup-set cycle
- `MAX_CALLS_PER_TICK = 3` provides headroom for Radix's legitimate re-entries while staying far below React's 50-update crash limit

