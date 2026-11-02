import { cn } from "@utils";

type Props = {
  className?: string;
  height?: number | string;
  width?: number | string;
  variant?: "circular" | "rectangular" | "rounded";
  tone?: "default" | "tile";
} & React.HTMLAttributes<HTMLDivElement>;

const variantClasses = {
  circular: "rounded-full",
  rectangular: "rounded-none",
  rounded: "rounded-lg"
};

const toneClasses = {
  default: {
    base: "bg-element-primary",
    gradient:
      "from-element-primary via-element-primary-active to-element-primary"
  },
  tile: {
    base: "bg-surface-secondary",
    gradient: "from-surface-secondary via-element-primary to-surface-secondary"
  }
};

export const Skeleton: React.FC<Props> = ({
  className,
  height,
  width,
  variant = "rectangular",
  tone = "default"
}) => {
  const formatSize = (size?: number | string) =>
    typeof size === "number" ? `${size}px` : size;

  return (
    <div
      className={cn(
        "relative block overflow-hidden h-4",
        variantClasses[variant],
        toneClasses[tone].base,
        className
      )}
      style={{ height: formatSize(height), width: formatSize(width) }}
    >
      <div
        className={cn(
          "absolute inset-0 animate-mago-shimmer bg-gradient-to-r",
          toneClasses[tone].gradient
        )}
      />
    </div>
  );
};
