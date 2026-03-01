import * as React from "react";
import { useComposedRefs } from "./radix-compose-refs-patch";
import { Fragment as Fragment2, jsx } from "react/jsx-runtime";

// @__NO_SIDE_EFFECTS__
function createSlot(ownerName: string) {
  const SlotClone = createSlotClone(ownerName);
  const Slot2 = React.forwardRef<any, any>((props, forwardedRef) => {
    const { children, ...slotProps } = props;
    const childrenArray = React.Children.toArray(children);
    const slottable = childrenArray.find(isSlottable);
    if (slottable) {
      const newElement = (slottable as React.ReactElement<any>).props.children;
      const newChildren = childrenArray.map((child) => {
        if (child === slottable) {
          if (React.Children.count(newElement) > 1) return React.Children.only(null);
          return React.isValidElement(newElement) ? (newElement as React.ReactElement<any>).props.children : null;
        } else {
          return child;
        }
      });
      return jsx(SlotClone, { ...slotProps, ref: forwardedRef, children: React.isValidElement(newElement) ? React.cloneElement(newElement as React.ReactElement, void 0, newChildren) : null });
    }
    return jsx(SlotClone, { ...slotProps, ref: forwardedRef, children });
  });
  Slot2.displayName = `${ownerName}.Slot`;
  return Slot2;
}

var Slot = createSlot("Slot");

// @__NO_SIDE_EFFECTS__
function createSlotClone(ownerName: string) {
  const SlotClone = React.forwardRef<any, any>((props, forwardedRef) => {
    const { children, ...slotProps } = props;
    if (React.isValidElement(children)) {
      const childrenRef = getElementRef(children);
      const props2 = mergeProps(slotProps, (children as React.ReactElement<any>).props);
      // PATCHED: use useComposedRefs (memoized) instead of composeRefs (unmemoized)
      // This prevents React 19 infinite loop caused by new ref callback every render
      const composedRef = useComposedRefs(forwardedRef, childrenRef);
      if ((children as React.ReactElement<any>).type !== React.Fragment) {
        props2.ref = forwardedRef ? composedRef : childrenRef;
      }
      return React.cloneElement(children as React.ReactElement, props2);
    }
    return React.Children.count(children) > 1 ? React.Children.only(null) : null;
  });
  SlotClone.displayName = `${ownerName}.SlotClone`;
  return SlotClone;
}

var SLOTTABLE_IDENTIFIER = Symbol("radix.slottable");

// @__NO_SIDE_EFFECTS__
function createSlottable(ownerName: string) {
  const Slottable2 = ({ children }: { children: React.ReactNode }) => {
    return jsx(Fragment2, { children });
  };
  (Slottable2 as any).displayName = `${ownerName}.Slottable`;
  (Slottable2 as any).__radixId = SLOTTABLE_IDENTIFIER;
  return Slottable2;
}

var Slottable = createSlottable("Slottable");

function isSlottable(child: React.ReactNode): child is React.ReactElement {
  return React.isValidElement(child) && typeof child.type === "function" && "__radixId" in child.type && (child.type as any).__radixId === SLOTTABLE_IDENTIFIER;
}

function mergeProps(slotProps: Record<string, any>, childProps: Record<string, any>) {
  const overrideProps = { ...childProps };
  for (const propName in childProps) {
    const slotPropValue = slotProps[propName];
    const childPropValue = childProps[propName];
    const isHandler = /^on[A-Z]/.test(propName);
    if (isHandler) {
      if (slotPropValue && childPropValue) {
        overrideProps[propName] = (...args: any[]) => {
          const result = childPropValue(...args);
          slotPropValue(...args);
          return result;
        };
      } else if (slotPropValue) {
        overrideProps[propName] = slotPropValue;
      }
    } else if (propName === "style") {
      overrideProps[propName] = { ...slotPropValue, ...childPropValue };
    } else if (propName === "className") {
      overrideProps[propName] = [slotPropValue, childPropValue].filter(Boolean).join(" ");
    }
  }
  return { ...slotProps, ...overrideProps };
}

function getElementRef(element: React.ReactElement) {
  let getter = Object.getOwnPropertyDescriptor((element as any).props, "ref")?.get;
  let mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
  if (mayWarn) {
    return (element as any).ref;
  }
  getter = Object.getOwnPropertyDescriptor(element, "ref")?.get;
  mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
  if (mayWarn) {
    return (element as any).props.ref;
  }
  return (element as any).props.ref || (element as any).ref;
}

export {
  Slot as Root,
  Slot,
  Slottable,
  createSlot,
  createSlottable
};
