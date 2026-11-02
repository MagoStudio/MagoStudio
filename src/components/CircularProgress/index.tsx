import { CircularProgressSize } from "@styles/types";
import { cn } from "@utils";

const sizeMap = {
  sm: { container: "h-4 w-4", radius: 12 },
  md: { container: "h-6 w-6", radius: 12 },
  lg: { container: "h-8 w-8", radius: 12 },
  xl: { container: "h-10 w-10", radius: 12 },
  xs: { container: "h-3 w-3", radius: 12 }
} as const;

const colorMap = {
  default: "fill-glyph-secondary",
  error: "fill-severity-error",
  "glyph-action-main": "fill-glyph-action-main",
  "glyph-action-secondary": "fill-glyph-action-secondary",
  "glyph-disabled": "fill-glyph-disabled",
  "glyph-error-hover": "fill-glyph-error-hover",
  "glyph-error": "fill-glyph-error",
  "glyph-invert-main": "fill-glyph-invert-main",
  "glyph-primary-on-pic": "fill-glyph-primary-on-pic",
  "glyph-primary": "fill-glyph-primary",
  "glyph-secondary": "fill-glyph-secondary",
  "glyph-success": "fill-glyph-success",
  "glyph-tertiary": "fill-glyph-tertiary",
  "glyph-warning": "fill-glyph-warning"
} as const;

type Props = {
  className?: string;
  color?: keyof typeof colorMap;
  disabled?: boolean;
  size?: CircularProgressSize;
} & React.HTMLAttributes<HTMLElement>;

export const CircularProgress: React.FC<Props> = ({
  className,
  color = "default",
  disabled,
  size = "md",
  ...props
}) => {
  const sizeClasses = sizeMap[size] || sizeMap.md;
  const fillColor = disabled
    ? "fill-glyph-disabled"
    : colorMap[color] || colorMap.default;

  return (
    <span
      className={cn(
        "relative flex items-center justify-center shrink-0 rounded-full text-sm",
        sizeClasses.container,
        className
      )}
      role="progressbar"
      aria-label={props["aria-label"]}
    >
      <svg
        className="absolute top-0 left-0 w-full h-full animate-circular-progress-spin"
        viewBox="0 0 128 128"
        width="24"
        height="24"
      >
        <circle
          cx="108.5"
          cy="89.75"
          r={sizeClasses.radius}
          className={fillColor}
        />
        <circle
          cx="108.5"
          cy="89.75"
          r={sizeClasses.radius}
          className={fillColor}
          transform="rotate(180 64 64)"
        />
      </svg>
    </span>
  );
};
