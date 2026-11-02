import { CircularProgress } from "@components/CircularProgress";
import { cn } from "@utils";
import { Button as AriaButton } from "react-aria-components/Button";
import { Link as AriaLink } from "react-aria-components/Link";
type GhostButtonProps = {
  children?: React.ReactNode;
  className?: string;
  colorScheme?:
    | "default"
    | "stroke"
    | "color"
    | "white"
    | "dark"
    | "danger"
    | "gradient";
  endIcon?: React.ReactNode;
  href?: string;
  isDisabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
  size?: "sm" | "md";
  startIcon?: React.ReactNode;
  type?: "button" | "submit" | "reset";
  "aria-label"?: string;
  title?: string;
  [key: `data-${string}`]: string | undefined;
};

const colorSchemeStyles = {
  default: cn(
    "bg-element-primary text-glyph-secondary",
    "data-[hovered]:bg-element-primary-active data-[hovered]:text-glyph-primary",
    "data-[pressed]:bg-element-primary-active data-[pressed]:text-glyph-primary",
    "data-[disabled]:text-glyph-disabled"
  ),
  stroke: cn(
    "border-[0.5px] border-glyph-stroke bg-transparent text-glyph-secondary",
    "data-[hovered]:bg-element-primary-active data-[hovered]:text-glyph-primary",
    "data-[pressed]:bg-element-primary-active data-[pressed]:text-glyph-primary",
    "data-[disabled]:text-glyph-disabled"
  ),
  color: cn(
    "border-[0.5px] border-glyph-stroke bg-transparent text-glyph-secondary",
    "data-[hovered]:bg-element-primary-active data-[hovered]:text-glyph-primary",
    "data-[pressed]:bg-element-primary-active data-[pressed]:text-glyph-primary",
    "data-[disabled]:border-glyph-disabled data-[disabled]:text-glyph-disabled"
  ),
  white: cn(
    "border border-glyph-stroke-2 bg-element-primary-on-pic text-glyph-invert-main",
    "data-[hovered]:bg-element-secondary-active",
    "data-[pressed]:bg-element-secondary-active",
    "data-[disabled]:border-transparent data-[disabled]:bg-element-tertiary data-[disabled]:text-glyph-disabled"
  ),
  dark: cn(
    "bg-element-primary text-glyph-secondary",
    "data-[hovered]:text-glyph-primary",
    "data-[pressed]:text-glyph-primary",
    "data-[disabled]:text-glyph-disabled"
  ),
  danger: cn(
    "bg-element-error text-glyph-primary-on-pic",
    "data-[hovered]:bg-glyph-error-hover",
    "data-[disabled]:bg-element-primary data-[disabled]:text-glyph-tertiary"
  ),
  gradient: cn(
    "bg-gradient-100 text-glyph-primary-on-pic",
    "relative before:absolute before:inset-0 before:rounded before:pointer-events-none before:opacity-0 before:bg-white/10",
    "data-[hovered]:before:opacity-100",
    "data-[disabled]:bg-none data-[disabled]:bg-element-primary data-[disabled]:text-glyph-tertiary data-[disabled]:before:opacity-0"
  )
} as const;

const sizeStyles = {
  sm: "h-(--height-button-sm)",
  md: "h-(--height-button-md)"
} as const;

const sharedClassName = (
  colorScheme: keyof typeof colorSchemeStyles,
  size: keyof typeof sizeStyles,
  hasIcon: boolean,
  loading: boolean | undefined,
  className: string | undefined
) =>
  cn(
    "relative inline-flex items-center justify-center rounded min-w-[42px] font-lato text-sm leading-5 text-center",
    sizeStyles[size],
    "outline-hidden focus-visible:ring-1 focus-visible:ring-glyph-secondary focus-visible:ring-offset-1",
    "select-none transition-colors",
    hasIcon ? "gap-1.5 pl-1.5 pr-2" : "gap-1 px-1.5",
    colorSchemeStyles[colorScheme],
    loading &&
      "[&>*:not([data-loading])]:invisible cursor-default pointer-events-none",
    loading && colorScheme === "danger" && "bg-glyph-error-hover",
    className
  );

export const GhostButton: React.FC<GhostButtonProps> = ({
  children,
  className,
  colorScheme = "default",
  endIcon,
  href,
  isDisabled,
  loading,
  onPress,
  size = "sm",
  startIcon,
  type = "button",
  ...rest
}) => {
  const hasIcon = Boolean(startIcon || endIcon);

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
      {startIcon && (
        <span className="shrink-0 flex items-center justify-center size-4">
          {startIcon}
        </span>
      )}
      {children && (
        <span className="flex items-center truncate">{children}</span>
      )}
      {endIcon && (
        <span className="shrink-0 flex items-center justify-center size-4">
          {endIcon}
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <AriaLink
        {...rest}
        href={href}
        isDisabled={isDisabled || loading}
        onPress={onPress}
        className={sharedClassName(
          colorScheme,
          size,
          hasIcon,
          loading,
          className
        )}
      >
        {content}
      </AriaLink>
    );
  }

  return (
    <AriaButton
      {...rest}
      type={type}
      isDisabled={isDisabled || loading}
      onPress={onPress}
      className={sharedClassName(
        colorScheme,
        size,
        hasIcon,
        loading,
        className
      )}
    >
      {content}
    </AriaButton>
  );
};
