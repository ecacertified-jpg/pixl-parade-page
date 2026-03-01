/**
 * Patched version of @radix-ui/react-compose-refs for React 19 compatibility.
 *
 * Problem: composeRefs() is called in render by Radix Slot, producing a new
 * function each render. If any composed ref triggers setState, React re-renders,
 * creating yet another composed ref — infinite loop.
 *
 * Fix: Depth counter per DOM node. Allows a small number of re-entrant ref
 * calls (needed for Radix internals) but caps them to prevent the infinite
 * setState loop in React 19.
 *
 * See: https://github.com/radix-ui/primitives/issues/3799
 */
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
