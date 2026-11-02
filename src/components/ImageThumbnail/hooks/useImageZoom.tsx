import { useState } from "react";
import { Dialog } from "react-aria-components/Dialog";
import { Modal, ModalOverlay } from "react-aria-components/Modal";

import { ImagePreview, ImagePreviewProps } from "../ImagePreview";

type UseImageZoomArgs = {
  src?: string;
  name?: string;
  imagePreviewProps?: Partial<ImagePreviewProps>;
};

type UseImageZoomReturn = {
  open: () => void;
  close: () => void;
  isOpen: boolean;
  modal: React.ReactNode;
};

export const useImageZoom = ({
  src,
  name,
  imagePreviewProps
}: UseImageZoomArgs): UseImageZoomReturn => {
  const [isZoomedIn, setIsZoomedIn] = useState(false);

  const open = () => {
    if (!src) return;
    setIsZoomedIn(true);
  };
  const close = () => setIsZoomedIn(false);

  const isOpen = Boolean(isZoomedIn && src);

  const modal = (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={setIsZoomedIn}
      className="fixed z-popover inset-0 w-full h-full"
    >
      <Modal className="h-full flex items-center justify-center">
        <Dialog className="outline-hidden">
          {src && (
            <ImagePreview
              imgSrc={src}
              name={name}
              onClose={close}
              {...imagePreviewProps}
            />
          )}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );

  return { open, close, isOpen, modal };
};
