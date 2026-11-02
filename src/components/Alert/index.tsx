import { CloseButton } from "@components/CloseButton";
import { Text } from "@components/Text";
import {
  BrandPalette,
  ElementPalette,
  GlyphPalette,
  SeverityPalette,
  SurfacePalette
} from "@styles/types";
import { cn } from "@utils";

type Props = {
  actions?: React.ReactNode;
  alertVariant?: "default" | "warning";
  className?: string;
  color?: BrandPalette | SeverityPalette | ElementPalette | SurfacePalette;
  contentColor?: GlyphPalette;
  canClose?: boolean;
  onClose?: () => void;
  severity?: SeverityPalette;
  title?: string;
} & React.HTMLAttributes<HTMLElement>;

const severityBackgroundClasses: Record<SeverityPalette, string> = {
  error: "bg-severity-error",
  success: "bg-severity-success",
  warning: "bg-severity-warning",
  info: "bg-severity-info"
};

const colorBackgroundClasses: Record<
  BrandPalette | SeverityPalette | ElementPalette | SurfacePalette,
  string
> = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  ...severityBackgroundClasses,
  "element-error": "bg-element-error",
  "element-in-progress": "bg-element-in-progress",
  "element-on-image": "bg-element-on-image",
  "element-primary": "bg-element-primary",
  "element-secondary-active": "bg-element-secondary-active",
  "element-secondary": "bg-element-secondary",
  "element-success": "bg-element-success",
  "element-tertiary": "bg-element-tertiary",
  "element-info": "bg-element-info",
  "surface-primary": "bg-surface-primary",
  "surface-secondary": "bg-surface-secondary",
  "surface-on-image": "bg-surface-on-image",
  "surface-bg-100": "bg-surface-bg-100",
  "surface-bg-200": "bg-surface-bg-200"
};

const contentColorClasses: Record<GlyphPalette, string> = {
  "glyph-action-main": "text-glyph-action-main",
  "glyph-action-secondary": "text-glyph-action-secondary",
  "glyph-disabled": "text-glyph-disabled",
  "glyph-error-hover": "text-glyph-error-hover",
  "glyph-error": "text-glyph-error",
  "glyph-invert-main": "text-glyph-invert-main",
  "glyph-primary-on-pic": "text-glyph-primary-on-pic",
  "glyph-primary": "text-glyph-primary",
  "glyph-secondary": "text-glyph-secondary",
  "glyph-success": "text-glyph-success",
  "glyph-tertiary": "text-glyph-tertiary",
  "glyph-warning": "text-glyph-warning"
};

export const Alert: React.FC<Props> = ({
  actions,
  alertVariant = "default",
  children,
  className,
  color,
  contentColor,
  canClose = true,
  onClose,
  severity,
  title
}) => {
  const isWarning = alertVariant === "warning";
  const defaultContentColor = isWarning
    ? "glyph-invert-main"
    : "glyph-primary-on-pic";
  const resolvedContentColor = contentColor ?? defaultContentColor;

  const backgroundClass = severity
    ? severityBackgroundClasses[severity]
    : color
      ? colorBackgroundClasses[color]
      : isWarning
        ? "bg-element-warning"
        : "bg-surface-bg-100-opacity-80";

  return (
    <div
      className={cn(
        "flex items-start gap-2 p-3 pb-4 w-full rounded-md",
        backgroundClass,
        contentColorClasses[resolvedContentColor],
        className
      )}
      role="alert"
    >
      <div className="flex flex-col items-start gap-1 grow">
        {title && (
          <Text
            color={resolvedContentColor}
            component="div"
            variant="md"
            weight="semibold"
          >
            {title}
          </Text>
        )}
        {children && (
          <Text variant="md" color={resolvedContentColor}>
            {children}
          </Text>
        )}
        {actions && <div className={cn("flex mt-2")}>{actions}</div>}
      </div>
      {canClose && (
        <div className="relative flex h-full min-w-8">
          <CloseButton
            className={cn(
              "absolute -right-2.5 -top-2.5",
              contentColorClasses[resolvedContentColor],
              isWarning && "hover:opacity-70 active:opacity-50"
            )}
            onClick={onClose}
          />
        </div>
      )}
    </div>
  );
};
