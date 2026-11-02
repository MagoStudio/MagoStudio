import { useCallback } from "react";

interface FloatingElementSetters {
  setReference: (element: HTMLElement | null) => void;
  setFloating: (element: HTMLElement | null) => void;
}

export const useFloatingRefCallbacks = (refs: FloatingElementSetters) => {
  const setReferenceElement = useCallback(
    (element: HTMLElement | null) => {
      refs.setReference(element);
    },
    [refs]
  );

  const setFloatingElement = useCallback(
    (element: HTMLElement | null) => {
      refs.setFloating(element);
    },
    [refs]
  );

  return { setReferenceElement, setFloatingElement };
};
