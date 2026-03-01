/**
 * Patched version of @radix-ui/react-compose-refs for React 19 compatibility.
 *
 * Problem: composeRefs() creates a new function each render. In React 19,
 * when ref identity changes, React runs cleanup then re-applies. If any
 * composed ref triggers setState, React re-renders synchronously, producing
 * yet another composed ref — infinite loop.
 *
 * Fix: Global boolean re-entrancy guard. The loop is fully synchronous
 * (setState during commit is sync in React 19), so a simple flag prevents
 * nested composeRefs from triggering further setState cascades.
 *
 * See: https://github.com/radix-ui/primitives/issues/3799
 */
import * as React from "react";

let isComposing = false;

function setRef<T>(ref: React.Ref<T> | undefined, value: T) {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref !== null && ref !== undefined) {
    (ref as React.MutableRefObject<T>).current = value;
  }
}

function composeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  return (node: T) => {
    if (isComposing) return;
    isComposing = true;
    try {
      refs.forEach((ref) => setRef(ref, node));
    } finally {
      isComposing = false;
    }
  };
}

function useComposedRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useCallback(composeRefs(...refs), refs);
}

export { composeRefs, useComposedRefs };
