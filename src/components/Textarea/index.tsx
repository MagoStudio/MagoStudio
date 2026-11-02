import { Icon } from "@components/Icon";
import { Tooltip } from "@components/Tooltip";
import { cn } from "@utils";
import { forwardRef, useCallback, useLayoutEffect, useRef } from "react";
import { useResizeObserver } from "usehooks-ts";

type Props = {
  /** Grow to fit the current value, including the value present on first render. */
  autoResize?: boolean;
  className?: string;
  disabled?: boolean;
  id?: string;
  placeholder?: string;
  readOnly?: boolean;
  resize?: "none" | "vertical";
  rows?: number;
  /** Shown on hover of the error icon, in place of a message under the field. */
  errorMessage?: string;
  severity?: "error";
  skeleton?: boolean;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const severityClasses: Record<string, string> = {
  error: "text-glyph-error hover:text-glyph-error-hover"
};

const severityTextareaClasses: Record<string, string> = {
  error: cn(
    "text-glyph-error hover:text-glyph-error border-glyph-error hover:border-glyph-error",
    "focus-visible:border-glyph-error focus-visible:text-glyph-error",
    // The resting outline is the action colour. A field already saying "wrong"
    // in red must not also glow purple on hover or focus.
    "hover:outline-glyph-error focus-visible:outline-glyph-error"
  )
};

export const Textarea = forwardRef<HTMLTextAreaElement, Props>(
  (
    {
      autoResize = false,
      className,
      disabled,
      errorMessage,
      id,
      placeholder,
      readOnly,
      resize = "none",
      rows,
      severity,
      skeleton,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const isVerticallyResizable = resize === "vertical";
    const isTextareaReadOnlyButEnabled = readOnly && !disabled;
    const resizeToContent = useCallback(() => {
      const element = textareaRef.current;
      if (!autoResize || !element) return;
      const isTextareaHidden = element.scrollHeight === 0;
      if (isTextareaHidden) return;
      element.style.height = "auto";
      const borderAndScrollbarHeightPx =
        element.offsetHeight - element.clientHeight;
      element.style.height = `${element.scrollHeight + borderAndScrollbarHeightPx}px`;
    }, [autoResize]);

    useLayoutEffect(resizeToContent, [resizeToContent, value]);
    const { width: textareaWidthPx } = useResizeObserver({
      ref: textareaRef as React.RefObject<HTMLTextAreaElement>,
      box: "border-box"
    });
    useLayoutEffect(resizeToContent, [resizeToContent, textareaWidthPx]);
    const setTextareaRef = useCallback(
      (element: HTMLTextAreaElement | null) => {
        textareaRef.current = element;
        if (typeof ref === "function") ref(element);
        else if (ref) ref.current = element;
      },
      [ref]
    );

    if (skeleton) {
      return (
        <div
          className={cn(
            "relative h-9 w-full rounded overflow-hidden bg-surface-secondary",
            className
          )}
        >
          <div className="absolute inset-0 animate-mago-shimmer bg-[image:linear-gradient(90deg,var(--color-surface-secondary)_34%,var(--color-element-primary)_60%,var(--color-surface-secondary)_86%)]" />
        </div>
      );
    }

    return (
      <div
        className={cn(
          "relative flex flex-col w-full",
          severity && severityClasses[severity]
        )}
      >
        <textarea
          ref={setTextareaRef}
          id={id}
          className={cn(
            "py-1.5 px-2 w-full outline-0 outline-offset-0 text-sm font-normal",
            "appearance-none relative flex items-center h-9 min-w-0 rounded border border-element-primary bg-element-primary text-glyph-secondary",
            "placeholder:text-glyph-tertiary",
            "hover:border-transparent hover:outline-1 hover:outline-glyph-action-main hover:-outline-offset-0 hover:text-glyph-primary",
            "focus-visible:border-transparent focus-visible:outline-1 focus-visible:outline-glyph-action-main focus-visible:-outline-offset-0 focus-visible:text-glyph-primary",
            "scrollbar-custom",
            autoResize && "overflow-y-hidden",
            isVerticallyResizable
              ? "resize-y [&::-webkit-resizer]:opacity-0"
              : "resize-none",
            isTextareaReadOnlyButEnabled &&
              "hover:border-element-primary hover:outline-0 hover:text-glyph-secondary",
            disabled &&
              "text-glyph-disabled bg-element-primary pointer-events-none select-none placeholder:text-glyph-disabled placeholder:select-none",
            disabled &&
              readOnly &&
              "hover:outline-glyph-disabled hover:border-glyph-disabled",
            severity === "error" && "pr-8",
            severity && severityTextareaClasses[severity],
            className
          )}
          disabled={disabled}
          readOnly={readOnly}
          placeholder={placeholder}
          rows={rows}
          value={value}
          onChange={(event) => {
            onChange?.(event);
            resizeToContent();
          }}
          {...props}
        />
        {severity === "error" &&
          (errorMessage ? (
            <Tooltip placement="top" textContent={errorMessage}>
              <span className="absolute right-2 top-2 flex cursor-help text-glyph-error">
                <Icon iconSet="16-filled" iconName="error" />
              </span>
            </Tooltip>
          ) : (
            <Icon
              iconSet="16-filled"
              iconName="error"
              className="pointer-events-none absolute right-2 top-2 text-glyph-error"
            />
          ))}
        {isVerticallyResizable && (
          <Icon
            iconSet="16-technical"
            iconName="corner"
            className="pointer-events-none absolute right-1 bottom-1 text-glyph-tertiary"
          />
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
