import { CircularProgress } from "@components/CircularProgress";
import { cn } from "@utils";
import { Button as AriaButton } from "react-aria-components/Button";
import { Link as AriaLink } from "react-aria-components/Link";
type SolidProps = {
  variant?: "solid";
  colorScheme?: "primary" | "secondary" | "gradient" | "danger";
};

type OutlinedProps = {
  variant: "outlined";
  colorScheme: "danger" | "onColor";
};

type VariantProps = SolidProps | OutlinedProps;

type MainButtonProps = {
  children?: React.ReactNode;
  className?: string;
  endIcon?: React.ReactNode;
  fullWidth?: boolean;
  href?: string;
  isDisabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
  onDisabledPress?: () => void;
  size?: "sm" | "md";
  startIcon?: React.ReactNode;
  type?: "button" | "submit" | "reset";
  "aria-label"?: string;
  "aria-pressed"?: boolean;
  title?: string;
  [key: `data-${string}`]: string | undefined;
} & VariantProps;

const colorSchemeStyles = {
  primary: cn(
    "bg-element-additional-active text-glyph-primary-on-pic backdrop-blur-xl",
    "data-[hovered]:brightness-115",
    "data-[pressed]:brightness-125",
    "data-[loading]:bg-element-tertiary data-[loading]:bg-none",
    "data-[disabled]:bg-element-tertiary data-[disabled]:text-glyph-disabled data-[disabled]:bg-none"
  ),
  secondary: cn(
    "bg-element-primary text-glyph-primary",
    "data-[hovered]:bg-element-primary-active",
    "data-[pressed]:bg-element-primary-active data-[pressed]:translate-y-0.5",
    "data-[loading]:bg-element-primary-active",
    "data-[disabled]:bg-element-tertiary data-[disabled]:text-glyph-disabled data-[disabled]:backdrop-blur-xl"
  ),
  gradient: cn(
    "bg-gradient-100 text-glyph-primary-on-pic",
    "data-[hovered]:brightness-110",
    "data-[pressed]:brightness-110",
    "data-[disabled]:bg-element-tertiary data-[disabled]:text-glyph-disabled data-[disabled]:bg-none"
  ),
  danger: cn(
    "border border-glyph-error text-glyph-error bg-transparent",
    "data-[hovered]:border-glyph-error-hover data-[hovered]:text-glyph-error-hover",
    "data-[pressed]:border-glyph-error-hover data-[pressed]:text-glyph-error-hover",
    "data-[disabled]:border-glyph-disabled data-[disabled]:text-glyph-disabled"
  ),
  solidDanger: cn(
    "bg-element-error text-glyph-primary-on-pic",
    "data-[hovered]:bg-glyph-error-hover",
    "data-[pressed]:!bg-element-error",
    "data-[loading]:bg-glyph-error-hover",
    "data-[disabled]:border data-[disabled]:border-glyph-disabled data-[disabled]:bg-transparent data-[disabled]:text-glyph-disabled"
  ),
  onColor: cn(
    "border border-glyph-primary-on-pic text-glyph-primary-on-pic bg-transparent",
    "data-[hovered]:border-glyph-secondary data-[hovered]:text-glyph-secondary",
    "data-[pressed]:border-glyph-secondary data-[pressed]:text-glyph-secondary",
    "data-[loading]:border-glyph-secondary data-[loading]:text-glyph-secondary",
    "data-[disabled]:border-glyph-disabled data-[disabled]:text-glyph-disabled"
  )
} as const;

const disabledLookStyles: Record<keyof typeof colorSchemeStyles, string> = {
  primary: "!bg-element-tertiary !text-glyph-disabled !bg-none cursor-default",
  secondary:
    "!bg-element-tertiary !text-glyph-disabled backdrop-blur-xl cursor-default",
  gradient: "!bg-element-tertiary !text-glyph-disabled !bg-none cursor-default",
  danger: "!border-glyph-disabled !text-glyph-disabled cursor-default",
  solidDanger:
    "!border !border-glyph-disabled !bg-transparent !text-glyph-disabled cursor-default",
  onColor: "!border-glyph-disabled !text-glyph-disabled cursor-default"
};

const sizeStyles = {
  sm: "h-button-xs px-1.5 py-0.5 text-sm gap-1",
  md: "h-button-md px-4 py-1.5 text-sm gap-2"
} as const;

const sharedClassName = (
  size: "sm" | "md",
  colorScheme: keyof typeof colorSchemeStyles,
  fullWidth: boolean | undefined,
  loading: boolean | undefined,
  className: string | undefined
) =>
  cn(
    "relative inline-flex items-center justify-center rounded font-lato leading-5 text-center",
    "outline-hidden data-[focus-visible=true]:ring-1 data-[focus-visible=true]:ring-glyph-secondary data-[focus-visible=true]:ring-offset-1",
    "select-none transition-colors",
    sizeStyles[size],
    colorSchemeStyles[colorScheme],
    fullWidth && "w-full",
    loading &&
      "[&>*:not([data-loading-indicator])]:invisible cursor-default pointer-events-none",
    className
  );

export const MainButton: React.FC<MainButtonProps> = ({
  children,
  className,
  colorScheme = "primary",
  endIcon,
  fullWidth,
  href,
  isDisabled,
  loading,
  onPress,
  onDisabledPress,
  size = "md",
  startIcon,
  type = "button",
  variant = "solid",
  ...rest
}) => {
  const isSolidDangerScheme =
    colorScheme === "danger" && variant !== "outlined";
  const resolvedColorScheme = isSolidDangerScheme ? "solidDanger" : colorScheme;

  const content = (
    <>
      {loading && (
        <span
          className="absolute inset-0 flex items-center justify-center"
          data-loading-indicator
        >
          <CircularProgress size="sm" color="glyph-primary-on-pic" />
        </span>
      )}
      {startIcon && (
        <span className="shrink-0 flex items-center justify-center size-4">
          {startIcon}
        </span>
      )}
      <span className="truncate inline-flex items-center">{children}</span>
      {endIcon && (
        <span className="shrink-0 flex items-center justify-center size-4">
          {endIcon}
        </span>
      )}
    </>
  );

  const isInactive = isDisabled || loading;
  const shouldInterceptPress = Boolean(isDisabled) && Boolean(onDisabledPress);
  const isNativelyDisabled = Boolean(isDisabled) && !shouldInterceptPress;
  const isLoadingOnly = Boolean(loading) && !isDisabled;
  const isAriaDisabledWithoutNativeDisable =
    shouldInterceptPress || isLoadingOnly;

  const handlePress = () => {
    if (shouldInterceptPress) {
      onDisabledPress?.();
      return;
    }
    if (isInactive) return;
    onPress?.();
  };

  const handleKeyDownWhileAriaDisabled = (
    event: React.KeyboardEvent<HTMLElement>
  ) => {
    if (
      isAriaDisabledWithoutNativeDisable &&
      (event.key === "Enter" || event.key === " ")
    ) {
      event.preventDefault();
    }
  };

  const ariaDisabledAttrs = isAriaDisabledWithoutNativeDisable
    ? { "aria-disabled": true as const }
    : {};

  const loadingAttrs = isLoadingOnly ? { "data-loading": "true" as const } : {};

  const interceptingDisabledClass = shouldInterceptPress
    ? disabledLookStyles[resolvedColorScheme]
    : undefined;

  if (href) {
    return (
      <AriaLink
        {...rest}
        {...ariaDisabledAttrs}
        {...loadingAttrs}
        href={href}
        isDisabled={isNativelyDisabled}
        onPress={handlePress}
        onKeyDown={handleKeyDownWhileAriaDisabled}
        className={cn(
          sharedClassName(
            size,
            resolvedColorScheme,
            fullWidth,
            loading,
            className
          ),
          interceptingDisabledClass
        )}
      >
        {content}
      </AriaLink>
    );
  }

  return (
    <AriaButton
      {...rest}
      {...ariaDisabledAttrs}
      {...loadingAttrs}
      type={isAriaDisabledWithoutNativeDisable ? "button" : type}
      isDisabled={isNativelyDisabled}
      onPress={handlePress}
      onKeyDown={handleKeyDownWhileAriaDisabled}
      className={cn(
        sharedClassName(
          size,
          resolvedColorScheme,
          fullWidth,
          loading,
          className
        ),
        interceptingDisabledClass
      )}
    >
      {content}
    </AriaButton>
  );
};
