import * as React from "react";

type PossibleRef<T> = React.Ref<T> | undefined | null;

function setRef<T>(ref: PossibleRef<T>, value: T | null) {
  if (typeof ref === "function") {
    ref(value);
    // Intentionally NOT returning cleanup to avoid React 19 infinite loop
  } else if (ref !== null && ref !== undefined) {
    (ref as React.MutableRefObject<T | null>).current = value;
  }
}

function composeRefs<T>(...refs: PossibleRef<T>[]): React.RefCallback<T> {
  return (node: T | null) => {
    refs.forEach((ref) => setRef(ref, node));
  };
}

function useComposedRefs<T>(...refs: PossibleRef<T>[]) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useCallback(composeRefs(...refs), refs);
}

export { composeRefs, useComposedRefs };
