import { CircularProgress } from "@components/CircularProgress";
import { cn } from "@utils";
import { forwardRef } from "react";
import { Button as AriaButton } from "react-aria-components/Button";
import { Link as AriaLink } from "react-aria-components/Link";
type IconActionButtonProps = {
  className?: string;
  href?: string;
  icon: React.ReactNode;
  isDisabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
  size?: "sm" | "xs";
  type?: "button" | "submit" | "reset";
  variant?: "transparent" | "dark" | "onImage" | "white" | "primary";
  "aria-label"?: string;
  "aria-pressed"?: boolean;
  "aria-expanded"?: boolean;
  title?: string;
  [key: `data-${string}`]: string | undefined;
};

const variantStyles = {
  transparent: cn(
    "bg-transparent text-glyph-secondary",
    "data-[hovered]:text-glyph-primary",
    "data-[pressed]:text-glyph-primary",
    "data-[disabled]:text-glyph-disabled"
  ),
  dark: cn(
    "bg-element-primary text-glyph-secondary",
    "data-[hovered]:bg-element-primary-active data-[hovered]:text-glyph-primary",
    "data-[pressed]:bg-element-primary-active data-[pressed]:text-glyph-primary",
    "data-[disabled]:text-glyph-disabled"
  ),
  onImage: cn(
    "backdrop-blur-xl bg-element-on-image text-glyph-primary-on-pic",
    "data-[hovered]:text-glyph-primary",
    "data-[pressed]:text-glyph-primary",
    "data-[disabled]:text-glyph-disabled"
  ),
  white: cn(
    "bg-element-primary-on-pic text-glyph-invert-main",
    "data-[hovered]:bg-element-secondary-active",
    "data-[pressed]:bg-element-secondary-active",
    "data-[disabled]:bg-element-tertiary data-[disabled]:text-glyph-disabled"
  ),
  primary: cn(
    "bg-element-additional-active text-glyph-primary-on-pic",
    "data-[hovered]:brightness-115",
    "data-[pressed]:brightness-125",
    "data-[disabled]:bg-element-tertiary data-[disabled]:text-glyph-disabled"
  )
} as const;

const sizeStyles = {
  sm: "size-8 p-1",
  xs: "size-6 p-1"
} as const;

const sharedClassName = (
  size: "sm" | "xs",
  variant: keyof typeof variantStyles,
  loading: boolean | undefined,
  className: string | undefined
) =>
  cn(
    "relative inline-flex items-center justify-center rounded",
    "outline-hidden focus-visible:ring-1 focus-visible:ring-glyph-secondary focus-visible:ring-offset-1",
    "select-none transition-colors",
    sizeStyles[size],
    variantStyles[variant],
    loading &&
      "[&>*:not([data-loading])]:invisible cursor-default pointer-events-none",
    className
  );

export const IconActionButton = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  IconActionButtonProps
>(function IconActionButton(
  {
    className,
    href,
    icon,
    isDisabled,
    loading,
    onPress,
    size = "xs",
    type = "button",
    variant = "transparent",
    ...rest
  },
  ref
) {
  const content = (
    <>
      {loading && (
        <span
          className="absolute inset-0 flex items-center justify-center"
          data-loading
        >
          <CircularProgress size="sm" />
        </span>
      )}
      <span className="shrink-0 flex items-center justify-center size-full">
        {icon}
      </span>
    </>
  );

  if (href) {
    return (
      <AriaLink
        {...rest}
        ref={ref as React.ForwardedRef<HTMLAnchorElement>}
        href={href}
        isDisabled={isDisabled || loading}
        onPress={onPress}
        className={sharedClassName(size, variant, loading, className)}
      >
        {content}
      </AriaLink>
    );
  }

  return (
    <AriaButton
      {...rest}
      ref={ref as React.ForwardedRef<HTMLButtonElement>}
      type={type}
      isDisabled={isDisabled || loading}
      onPress={onPress}
      className={sharedClassName(size, variant, loading, className)}
    >
      {content}
    </AriaButton>
  );
});
