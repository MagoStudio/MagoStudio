/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect for external sync */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type MessageVariant = "error" | "warning" | "success";
type MessagePlacement = "top" | "bottom";

const DEFAULT_DURATION_MS = 2000;
const DEFAULT_OFFSET = 8;
const VIEWPORT_PADDING = 8;
const MAX_POSITION_ATTEMPTS = 30;

const variantStyles: Record<MessageVariant, string> = {
  error: "bg-element-error text-glyph-primary-on-pic",
  warning: "bg-element-warning text-glyph-invert-main",
  success: "bg-element-success text-glyph-invert-main"
};

interface MessageProps {
  variant: MessageVariant;
  children: React.ReactNode;
  duration?: number;
  onDismiss?: () => void;
  className?: string;
  anchorRef?: React.RefObject<HTMLElement | null>;
  placement?: MessagePlacement;
  offset?: number;
}

function useMessagePosition(
  anchorRef: React.RefObject<HTMLElement | null> | undefined,
  messageRef: React.RefObject<HTMLDivElement | null>,
  placement: MessagePlacement,
  offset: number
) {
  const [style, setStyle] = useState<React.CSSProperties>({
    position: "fixed",
    visibility: "hidden"
  });

  useLayoutEffect(() => {
    if (!anchorRef) return;

    let retryFrame = 0;
    let attempts = 0;

    const reposition = () => {
      const anchor = anchorRef.current;
      const message = messageRef.current;
      if (!anchor || !message) {
        if (attempts++ < MAX_POSITION_ATTEMPTS) {
          retryFrame = requestAnimationFrame(reposition);
        }
        return;
      }

      const anchorRect = anchor.getBoundingClientRect();
      const messageWidth = message.offsetWidth;
      const messageHeight = message.offsetHeight;

      const top =
        placement === "top"
          ? anchorRect.top - messageHeight - offset
          : anchorRect.bottom + offset;

      let left = anchorRect.left + anchorRect.width / 2 - messageWidth / 2;
      left = Math.max(
        VIEWPORT_PADDING,
        Math.min(left, window.innerWidth - messageWidth - VIEWPORT_PADDING)
      );

      setStyle({ position: "fixed", top, left, visibility: "visible" });
    };

    reposition();
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);

    return () => {
      cancelAnimationFrame(retryFrame);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [anchorRef, messageRef, placement, offset]);

  return style;
}

export function Message({
  variant,
  children,
  duration = DEFAULT_DURATION_MS,
  onDismiss,
  className,
  anchorRef,
  placement = "top",
  offset = DEFAULT_OFFSET
}: MessageProps) {
  const messageRef = useRef<HTMLDivElement | null>(null);
  const positionStyle = useMessagePosition(
    anchorRef,
    messageRef,
    placement,
    offset
  );

  useEffect(() => {
    if (!onDismiss) return;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [onDismiss, duration]);

  const content = (
    <div
      ref={anchorRef ? messageRef : undefined}
      role="status"
      style={anchorRef ? positionStyle : undefined}
      className={`rounded px-1.5 py-1 backdrop-blur-[10px] text-sm leading-5 whitespace-nowrap z-tooltip ${variantStyles[variant]} ${className ?? ""}`}
    >
      {children}
    </div>
  );

  if (anchorRef) {
    return createPortal(content, document.body);
  }

  return content;
}
