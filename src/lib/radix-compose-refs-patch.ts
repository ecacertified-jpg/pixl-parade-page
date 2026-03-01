import React from 'react';

type PossibleRef<T> = React.Ref<T> | undefined | null;

let isComposing = false;

function setRef<T>(ref: PossibleRef<T>, value: T | null) {
  if (typeof ref === 'function') {
    ref(value);
  } else if (ref !== null && ref !== undefined) {
    (ref as React.MutableRefObject<T | null>).current = value;
  }
}

function composeRefs<T>(...refs: PossibleRef<T>[]): React.RefCallback<T> {
  return (node: T | null) => {
    if (isComposing) return;
    isComposing = true;
    try {
      refs.forEach((ref) => setRef(ref, node));
    } finally {
      isComposing = false;
    }
  };
}

function useComposedRefs<T>(...refs: PossibleRef<T>[]) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useMemo(() => composeRefs(...refs), refs);
}

export { composeRefs, useComposedRefs };
