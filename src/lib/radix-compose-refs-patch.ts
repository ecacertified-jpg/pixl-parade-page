import * as React from "react";

type PossibleRef<T> = React.Ref<T> | undefined | null;

// Track refs currently being set to prevent re-entrant loops
const activeSetRefs = new Set<string>();
let idCounter = 0;
const refIds = new WeakMap<Function, number>();

function getRefId(ref: Function): number {
  let id = refIds.get(ref);
  if (id === undefined) {
    id = ++idCounter;
    refIds.set(ref, id);
  }
  return id;
}

function setRef<T>(ref: PossibleRef<T>, value: T | null) {
  if (typeof ref === "function") {
    const refId = getRefId(ref);
    const key = `${refId}`;
    if (activeSetRefs.has(key)) return;
    activeSetRefs.add(key);
    try {
      ref(value);
    } finally {
      activeSetRefs.delete(key);
    }
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
  const refsRef = React.useRef(refs);
  refsRef.current = refs;

  return React.useCallback((node: T | null) => {
    refsRef.current.forEach((ref) => setRef(ref, node));
  }, []);
}

export { composeRefs, useComposedRefs };
