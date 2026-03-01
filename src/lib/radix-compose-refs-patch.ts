/**
 * Patch for @radix-ui/react-compose-refs to prevent infinite ref loops with React 19.
 * React 19 calls ref cleanup functions, which triggers compose-refs to re-assign all refs,
 * causing an infinite setState loop. This patch adds a re-entrancy guard.
 */

let isComposing = false;

type PossibleRef<T> = React.Ref<T> | undefined;

function setRef<T>(ref: PossibleRef<T>, value: T) {
  if (typeof ref === 'function') {
    ref(value);
  } else if (ref !== null && ref !== undefined) {
    (ref as React.MutableRefObject<T>).current = value;
  }
}

function composeRefs<T>(...refs: PossibleRef<T>[]) {
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

function useComposedRefs<T>(...refs: PossibleRef<T>[]) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useMemo(() => composeRefs(...refs), refs);
}

import React from 'react';

export { composeRefs, useComposedRefs };
