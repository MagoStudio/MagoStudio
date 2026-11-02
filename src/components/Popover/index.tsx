import { cn } from "@utils";
import { Dialog } from "react-aria-components/Dialog";
import {
  Popover as AriaPopover,
  OverlayArrow
} from "react-aria-components/Popover";
const DEFAULT_OFFSET_PX = 10;

interface PopoverProps {
  children: React.ReactNode;
  placement?: "top" | "bottom" | "left" | "right" | "start" | "end";
  offset?: number;
  className?: string;
  triggerRef?: React.RefObject<Element | null>;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  onMouseEnter?: React.MouseEventHandler;
  onMouseLeave?: React.MouseEventHandler;
  variant?: "default" | "warning";
  isNonModal?: boolean;
}

const bubbleVariants = {
  default: "bg-surface-bg-100 text-glyph-primary-on-pic",
  warning: "bg-element-warning text-glyph-invert-main"
};

const arrowVariants = {
  default: "fill-surface-bg-100",
  warning: "fill-element-warning"
};

export function Popover({
  children,
  placement = "top",
  offset: offsetPx = DEFAULT_OFFSET_PX,
  className,
  triggerRef,
  isOpen,
  onOpenChange,
  onMouseEnter,
  onMouseLeave,
  variant = "default",
  isNonModal = true
}: PopoverProps) {
  return (
    <AriaPopover
      triggerRef={triggerRef}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement={placement}
      offset={offsetPx}
      isNonModal={isNonModal}
      className={cn(
        "z-popover max-w-120 rounded backdrop-blur-md shadow-popover",
        bubbleVariants[variant],
        className
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <OverlayArrow className="group">
        <svg
          width={12}
          height={12}
          viewBox="0 0 12 12"
          className={cn(
            "block group-data-[placement=bottom]:rotate-180 group-data-[placement=left]:-rotate-90 group-data-[placement=right]:rotate-90",
            arrowVariants[variant]
          )}
        >
          <path d="M0 0L4.93934 4.93934C5.52513 5.52513 6.47487 5.52513 7.06066 4.93934L12 0" />
        </svg>
      </OverlayArrow>
      <Dialog className="max-h-[calc(100vh-2rem)] overflow-x-hidden overflow-y-auto scrollbar-custom p-3 text-sm leading-5 outline-none whitespace-pre-line">
        {children}
      </Dialog>
    </AriaPopover>
  );
}
