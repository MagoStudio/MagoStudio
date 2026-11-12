import { createContext, useContext } from "react";

// Portaled overlays must remain inside the dialog panel so Headless UI's
// outside-click and focus handling recognize them as part of the modal.
export const ModalPortalContext = createContext<HTMLElement | undefined>(
  undefined
);

export const useModalPortalContainer = () => useContext(ModalPortalContext);
