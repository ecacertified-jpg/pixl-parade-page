/**
 * Patched version of @radix-ui/react-compose-refs for React 19 compatibility.
 *
 * Problem: composeRefs() is called in render by Radix Slot, producing a new
 * function each render. If any composed ref triggers setState, React re-renders,
 * creating yet another composed ref — infinite loop.
 *
 * Fix: Global synchronous depth counter. Since the problematic calls are nested
 * in the call stack (dispatchSetState is synchronous during React 19 commit),
 * we cap the nesting depth. Legitimate Radix nesting is ~2-4 levels; infinite
 * loops would reach 50+. We cap at 8 for safety.
 *
 * See: https://github.com/radix-ui/primitives/issues/3799
 */
import * as React from "react";

// Global depth counter for synchronous nested composeRefs calls.
// Tracks how deep we are in the call stack to break infinite loops.
let globalDepth = 0;
const MAX_DEPTH = 8;

function setRef<T>(ref: React.Ref<T> | undefined, value: T) {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref !== null && ref !== undefined) {
    (ref as React.MutableRefObject<T>).current = value;
  }
}

function composeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  return (node: T) => {
    globalDepth++;
    if (globalDepth > MAX_DEPTH) {
      globalDepth--;
      return;
    }
    try {
      refs.forEach((ref) => setRef(ref, node));
    } finally {
      globalDepth--;
    }
  };
}

function useComposedRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useCallback(composeRefs(...refs), refs);
}

export { composeRefs, useComposedRefs };
