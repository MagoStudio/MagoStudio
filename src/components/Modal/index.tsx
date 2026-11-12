import { Backdrop } from "@components/Backdrop";
import { CloseButton } from "@components/CloseButton";
import { Text } from "@components/Text";
import { Dialog, DialogPanel } from "@headlessui/react";
import { Shadows } from "@styles/types";
import { cn } from "@utils";
import { useState } from "react";

import { ModalPortalContext } from "./ModalPortalContext";

type Props = {
  alertIcon?: React.ReactNode;
  centeredTitle?: boolean;
  children?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  elevation?: Shadows;
  enterAnimation?: boolean;
  fullHeight?: boolean;
  onClose: () => void;
  open?: boolean;
  preventOutsideClick?: boolean;
  showCloseButton?: boolean;
  surfaceClassName?: string;
  title?: string;
  titleContent?: React.ReactNode;
  unlimitedTitleHeight?: boolean;
  width?: "sm" | "md" | "lg" | "xl";
  widthClassName?: string;
} & React.HTMLAttributes<HTMLElement>;

const widthClasses = {
  sm: "w-screen md:min-w-[37.5rem] md:w-[37.5rem]",
  md: "w-screen md:min-w-[57.25rem] md:w-1/2",
  lg: "w-screen lg:min-w-[67.75rem] lg:w-[67.75rem] h-[calc(100vh-3.5rem)] max-h-[calc(100vh-3.5rem)]",
  xl: "w-screen lg:min-w-[65.875rem] lg:w-[65.875rem]"
};

export const Modal: React.FC<Props> = ({
  alertIcon,
  centeredTitle,
  children,
  className,
  contentClassName,
  elevation = "modal",
  enterAnimation = false,
  fullHeight,
  onClose,
  open,
  preventOutsideClick = false,
  showCloseButton = true,
  surfaceClassName,
  title,
  titleContent,
  unlimitedTitleHeight,
  width = "md",
  widthClassName
}) => {
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null
  );
  const handleModalClose = () => {
    if (preventOutsideClick) {
      return;
    }
    onClose();
  };
  return (
    <Dialog
      as="div"
      className={cn("fixed z-modal isolate inset-0 overflow-y-auto", className)}
      onClose={handleModalClose}
      open={open}
    >
      <Backdrop className="!z-0" />
      <div
        className={cn(
          "absolute z-10 pointer-events-auto flex flex-col items-center justify-center top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2",
          fullHeight ? "h-[calc(100vh-120px)]" : "max-h-screen md:max-h-[70%]",
          widthClassName ?? widthClasses[width]
        )}
      >
        <DialogPanel ref={setPortalContainer} className="h-full w-full">
          <ModalPortalContext.Provider value={portalContainer ?? undefined}>
            <div
              className={cn(
                "relative h-full w-full text-glyph-primary backdrop-blur-xl rounded-3xl bg-surface-secondary",
                `shadow-${elevation}`, // eslint-disable-line better-tailwindcss/no-unknown-classes
                enterAnimation && "animate-fade-slide-in",
                surfaceClassName
              )}
            >
              <div
                className={cn("relative p-4 h-full w-full", contentClassName)}
              >
                <div
                  className={cn(
                    "flex flex-col",
                    fullHeight && "h-full min-h-0"
                  )}
                >
                  <div
                    className={cn(
                      "relative flex flex-nowrap items-center justify-between min-h-8 w-full",
                      (title || titleContent) && "h-[34px] mb-5",
                      unlimitedTitleHeight && "h-auto items-start"
                    )}
                  >
                    <div className="flex-1 overflow-hidden">
                      {alertIcon && (
                        <div className="flex items-center justify-center mt-2 select-none">
                          {alertIcon}
                        </div>
                      )}
                      {titleContent
                        ? titleContent
                        : title && (
                            <Text
                              align={centeredTitle ? "center" : "left"}
                              color="glyph-primary"
                              select="none"
                              variant="md"
                              overflow="hidden"
                              textOverflow="ellipsis"
                              whiteSpace="nowrap"
                            >
                              {title}
                            </Text>
                          )}
                    </div>

                    {showCloseButton && (
                      <div className="flex justify-end z-10">
                        <CloseButton onClick={handleModalClose} />
                      </div>
                    )}
                  </div>

                  {children}
                </div>
              </div>
            </div>
          </ModalPortalContext.Provider>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
