/**
 * Patched version of @radix-ui/react-compose-refs for React 19 compatibility.
 *
 * Problem: composeRefs() creates a new function each render. In React 19,
 * when ref identity changes, React runs cleanup then re-applies. If any
 * composed ref triggers setState, React re-renders, producing yet another
 * composed ref — infinite loop. Each iteration is a *separate* call stack,
 * so synchronous depth counters don't work.
 *
 * Fix: Per-node call counter with time-based reset. Track how many times
 * each DOM node receives a ref call within a short window. Legitimate
 * usage is 1-4 calls; infinite loops hit 50+. We cap at 10.
 *
 * See: https://github.com/radix-ui/primitives/issues/3799
 */
import * as React from "react";

const nodeCallCount = new WeakMap<object, number>();
const nodeTimers = new WeakMap<object, ReturnType<typeof setTimeout>>();
const MAX_CALLS = 2;
const RESET_MS = 100;

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
      const key = node as object;
      const count = (nodeCallCount.get(key) || 0) + 1;

      if (count > MAX_CALLS) {
        return; // Break infinite loop
      }

      nodeCallCount.set(key, count);

      // Reset counter after quiet period
      const existing = nodeTimers.get(key);
      if (existing) clearTimeout(existing);
      nodeTimers.set(
        key,
        setTimeout(() => {
          nodeCallCount.delete(key);
          nodeTimers.delete(key);
        }, RESET_MS)
      );

      refs.forEach((ref) => setRef(ref, node));
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
