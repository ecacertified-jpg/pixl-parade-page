import * as React from "react";

type PossibleRef<T> = React.Ref<T> | undefined | null;

function setRef<T>(ref: PossibleRef<T>, value: T | null) {
  if (typeof ref === "function") {
    ref(value);
    // Do NOT return cleanup — prevents React 19 infinite loop
  } else if (ref !== null && ref !== undefined) {
    (ref as React.MutableRefObject<T | null>).current = value;
  }
}

function composeRefs<T>(...refs: PossibleRef<T>[]): React.RefCallback<T> {
  return (node: T | null) => {
    refs.forEach((ref) => setRef(ref, node));
  };
}

function useComposedRefs<T>(...refs: PossibleRef<T>[]): React.RefCallback<T> {
  // Store latest refs in a ref so the callback identity never changes
  const refsRef = React.useRef(refs);
  refsRef.current = refs;

  // Stable callback that never changes identity — prevents React 19 infinite loop
  // even when inline arrow functions are passed as refs
  return React.useCallback((node: T | null) => {
    refsRef.current.forEach((ref) => setRef(ref, node));
  }, []);
}

export { composeRefs, useComposedRefs };
