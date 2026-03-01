/**
 * Patched version of @radix-ui/react-compose-refs for React 19 compatibility.
 *
 * Problem: composeRefs() is called in render by Radix Slot, producing a new
 * function each render. If any composed ref triggers setState, React re-renders,
 * creating yet another composed ref — infinite loop.
 *
 * Fix: Re-entrancy guard on the DOM node itself (WeakSet). If the same node
 * is already being processed synchronously, skip. Clear after microtask.
 *
 * See: https://github.com/radix-ui/primitives/issues/3799
 */
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useCallback(composeRefs(...refs), refs);
}

export { composeRefs, useComposedRefs };
