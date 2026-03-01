/**
 * Patched version of @radix-ui/react-compose-refs for React 19 compatibility.
 *
 * Problem: composeRefs() is called in render by Radix Slot, producing a new
 * function each render. If any composed ref triggers setState, React re-renders,
 * creating yet another composed ref — infinite loop.
 *
 * Fix: Track the last node set per-ref and skip if unchanged.
 *
 * See: https://github.com/radix-ui/primitives/issues/3799
 */
import * as React from "react";

const refNodes = new WeakMap<Function, object>();

function setRef<T>(ref: React.Ref<T> | undefined, value: T) {
  if (typeof ref === "function") {
    // Skip if this ref was already called with the same node
    if (value != null && typeof value === "object") {
      const prev = refNodes.get(ref as Function);
      if (prev === value) return;
      refNodes.set(ref as Function, value as object);
    }
    ref(value);
  } else if (ref !== null && ref !== undefined) {
    (ref as React.MutableRefObject<T>).current = value;
  }
}

function composeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  return (node: T) => {
    refs.forEach((ref) => setRef(ref, node));
  };
}

function useComposedRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useCallback(
    (node: T) => {
      const cleanups: ((() => void) | undefined)[] = [];
      refs.forEach((ref) => {
        if (typeof ref === "function") {
          const result = ref(node);
          if (typeof result === "function") {
            cleanups.push(result);
          }
        } else if (ref !== null && ref !== undefined) {
          (ref as React.MutableRefObject<T>).current = node;
        }
      });

      if (cleanups.length > 0) {
        return () => {
          cleanups.forEach((cleanup) => cleanup?.());
          refs.forEach((ref) => {
            if (typeof ref === "function") {
              ref(null as unknown as T);
            } else if (ref !== null && ref !== undefined) {
              (ref as React.MutableRefObject<T>).current = null as unknown as T;
            }
          });
        };
      }
    },
    refs
  );
}

export { composeRefs, useComposedRefs };
