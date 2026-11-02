import {
  useFloating,
  autoUpdate,
  offset,
  arrow,
  flip,
  shift,
  type Placement,
  FloatingArrow
} from "@floating-ui/react";
import { useFloatingRefCallbacks } from "@hooks/useFloatingRefCallbacks";
import { useTooltip } from "@hooks/useTooltip";
import { cn } from "@utils";
import { useState } from "react";
import ReactDOM from "react-dom";

type Props = {
  arrowClassName?: string;
  children?: React.ReactNode;
  className?: string;
  isVisible?: boolean;
  hoverDelay?: number;
  noArrow?: boolean;
  placement?: Placement;
  scrollable?: boolean;
  textContent?: React.ReactNode;
  targetElement?: HTMLElement | null;
  trigger?: React.ReactNode;
  disabled?: boolean;
  variant?: "default" | "warning";
  isDismissedOnPress?: boolean;
};

const bubbleVariants = {
  default: [
    "bg-surface-bg-100-opacity-80 text-glyph-primary-on-pic text-sm",
    "shadow-[0px_-1px_0px_0px_rgba(87,97,255,0.8)] backdrop-blur-[10px]"
  ],
  warning: ["bg-element-warning text-glyph-invert-main text-md shadow-popover"]
};

const arrowVariants = {
  default: "fill-surface-bg-100-opacity-80",
  warning: "fill-element-warning"
};

const ARROW_HEIGHT = 8;
const GAP = 2;

export const Tooltip: React.FC<Props> = ({
  arrowClassName,
  children,
  className,
  isVisible,
  hoverDelay,
  noArrow = false,
  placement = "bottom",
  scrollable = false,
  textContent,
  targetElement,
  trigger,
  disabled = false,
  variant = "default",
  isDismissedOnPress = false
}: Props) => {
  const [arrowElement, setArrowElement] = useState<SVGSVGElement | null>(null);
  const {
    visible: hoverVisible,
    showTooltip,
    hideTooltip,
    dismissTooltipNow
  } = useTooltip(hoverDelay);
  const [triggerElement, setTriggerElement] = useState<HTMLElement | null>(
    null
  );
  const isTargetProvided = targetElement !== undefined;
  const triggerNode = trigger ?? (!isTargetProvided ? children : undefined);
  const referenceElement = isTargetProvided ? targetElement : triggerElement;
  const isTooltipInDialog = !!referenceElement?.closest('[role="dialog"]');
  const hasControlledVisibility = typeof isVisible === "boolean";
  const tooltipVisible = hasControlledVisibility ? isVisible : hoverVisible;

  const { refs, floatingStyles, context } = useFloating({
    elements: {
      reference: referenceElement
    },
    placement,
    middleware: [
      offset({ mainAxis: GAP + ARROW_HEIGHT }),
      flip(),
      shift({ padding: 8 }),
      arrow({ element: arrowElement })
    ],
    whileElementsMounted: autoUpdate
  });
  const { setFloatingElement } = useFloatingRefCallbacks(refs);

  if (!referenceElement && !triggerNode) return null;

  return (
    <>
      {triggerNode && (
        <div
          ref={setTriggerElement}
          className="flex"
          onMouseEnter={
            hasControlledVisibility || disabled ? undefined : showTooltip
          }
          onMouseLeave={
            hasControlledVisibility || disabled ? undefined : hideTooltip
          }
          onPointerDownCapture={
            isDismissedOnPress ? dismissTooltipNow : undefined
          }
        >
          {triggerNode}
        </div>
      )}

      {!disabled &&
        tooltipVisible &&
        referenceElement &&
        ReactDOM.createPortal(
          <div
            ref={setFloatingElement}
            data-react-aria-top-layer={isTooltipInDialog ? "true" : undefined}
            className={cn(
              "relative z-tooltip text-wrap whitespace-pre-line",
              "py-2 px-3 rounded-[4px] w-max max-w-106",
              "select-none",
              bubbleVariants[variant],
              scrollable && "max-h-62 overflow-y-auto scrollbar-custom",
              className
            )}
            role="tooltip"
            style={floatingStyles}
          >
            {!noArrow && (
              <FloatingArrow
                ref={setArrowElement}
                context={context}
                className={cn(arrowVariants[variant], arrowClassName)}
              />
            )}
            {textContent || "No content"}
          </div>,
          document.body
        )}
    </>
  );
};
