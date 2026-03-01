import * as React from "react";

type PossibleRef<T> = React.Ref<T> | undefined | null;

let isComposing = false;

function setRef<T>(ref: PossibleRef<T>, value: T | null): (() => void) | void {
  if (typeof ref === "function") {
    const cleanup = ref(value);
    return typeof cleanup === "function" ? cleanup : undefined;
  } else if (ref !== null && ref !== undefined) {
    (ref as React.MutableRefObject<T | null>).current = value;
  }
}

function composeRefs<T>(...refs: PossibleRef<T>[]): React.RefCallback<T> {
  return (node: T | null) => {
    if (isComposing) return;
    isComposing = true;
    try {
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
          if (isComposing) return;
          isComposing = true;
          try {
            for (let i = 0; i < cleanups.length; i++) {
              const cleanup = cleanups[i];
              if (typeof cleanup === "function") {
                cleanup();
              } else {
                setRef(refs[i], null);
              }
            }
          } finally {
            isComposing = false;
          }
        };
      }
    } finally {
      isComposing = false;
    }
  };
}

function useComposedRefs<T>(...refs: PossibleRef<T>[]) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useCallback(composeRefs(...refs), refs);
}

export { composeRefs, useComposedRefs };
