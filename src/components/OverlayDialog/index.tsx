import { cn } from "@utils";
import { Dialog } from "react-aria-components/Dialog";
import { Modal, ModalOverlay } from "react-aria-components/Modal";
import { useWindowSize } from "usehooks-ts";

import {
  OverlayDialogSize,
  getOverlayDialogSizeStyle
} from "./utils/getOverlayDialogSizeStyle";

type OverlayDialogProps = {
  children: React.ReactNode;
  className?: string;
  isDismissableByOutsideClick?: boolean;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  size: OverlayDialogSize;
};

export function OverlayDialog({
  children,
  className,
  isDismissableByOutsideClick = true,
  isOpen,
  onOpenChange,
  size
}: OverlayDialogProps) {
  const { width: viewportWidthPx, height: viewportHeightPx } = useWindowSize();
  const sizeStyle = getOverlayDialogSizeStyle(size, {
    widthPx: viewportWidthPx,
    heightPx: viewportHeightPx
  });

  const keepFocusInsideDialogOnBackdropPress = (
    event: React.MouseEvent<HTMLElement>
  ) => {
    if (isDismissableByOutsideClick) return;
    if (event.target !== event.currentTarget) return;
    event.preventDefault();
  };

  return (
    <ModalOverlay
      isDismissable={isDismissableByOutsideClick}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      onMouseDown={keepFocusInsideDialogOnBackdropPress}
      data-testid="overlay-dialog-scrim"
      className="fixed inset-0 z-modal flex items-center justify-center bg-backdrop"
    >
      <Modal
        style={sizeStyle}
        className={cn(
          "rounded-[20px] bg-surface-secondary backdrop-blur-[10px] shadow-[0px_0px_8px_0px_rgba(0,0,0,0.6)] outline-hidden",
          className
        )}
      >
        <Dialog className="h-full w-full outline-hidden">{children}</Dialog>
      </Modal>
    </ModalOverlay>
  );
}
