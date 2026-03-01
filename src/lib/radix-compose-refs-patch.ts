/**
 * Patched version of @radix-ui/react-compose-refs for React 19 compatibility.
 * 
 * In React 19, ref callbacks can return cleanup functions. When composeRefs()
 * is called directly in render (not memoized), React sees a new function each
 * render, calls cleanup for old ref, sets new ref — triggering an infinite loop.
 * 
 * This patch adds a guard to prevent recursive setRef calls.
 * See: https://github.com/radix-ui/primitives/issues/3799
 */
import * as React from "react";

let isSettingRef = false;

function setRef<T>(ref: React.Ref<T> | undefined, value: T) {
  if (typeof ref === "function") {
    // Guard against recursive calls that cause infinite loops in React 19
    if (isSettingRef) return;
    isSettingRef = true;
    try {
      return ref(value);
    } finally {
      isSettingRef = false;
    }
  } else if (ref !== null && ref !== undefined) {
    (ref as React.MutableRefObject<T>).current = value;
  }
}

function composeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  return (node: T) => {
    let hasCleanup = false;
    const cleanups = refs.map((ref) => {
      const cleanup = setRef(ref, node);
      if (!hasCleanup && typeof cleanup === "function") {
        hasCleanup = true;
      }
      return cleanup;
    });

    if (hasCleanup) {
      return () => {
        for (let i = 0; i < cleanups.length; i++) {
          const cleanup = cleanups[i];
          if (typeof cleanup === "function") {
            (cleanup as () => void)();
          } else {
            setRef(refs[i], null as unknown as T);
          }
        }
      };
    }
  };
}

function useComposedRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useCallback(composeRefs(...refs), refs);
}

export { composeRefs, useComposedRefs };
