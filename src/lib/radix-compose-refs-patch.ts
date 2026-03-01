/**
 * Patched version of @radix-ui/react-compose-refs for React 19 compatibility.
 *
 * composeRefs() is called directly in render by Radix Slot, creating a new
 * function every render. If it returns a cleanup, React 19 enters an infinite
 * cleanup-set-rerender loop. Fix: composeRefs never returns cleanup.
 * useComposedRefs is safe because useCallback stabilises identity.
 *
 * See: https://github.com/radix-ui/primitives/issues/3799
 */
import * as React from "react";

function setRef<T>(ref: React.Ref<T> | undefined, value: T) {
  if (typeof ref === "function") {
    const result = ref(value);
    return typeof result === "function" ? result : undefined;
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
