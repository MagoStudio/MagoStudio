import { cn } from "@utils";

const MAX_PERCENTAGE = 100;

const sizeClasses = {
  sm: "h-0.5 min-h-0.5",
  md: "h-1 min-h-1",
  lg: "h-2 min-h-2"
};

type Props = {
  className?: string;
  size?: "sm" | "md" | "lg";
  totalValue?: number;
  value?: number;
  animation?: "emptying" | "filling";
  color?: string;
} & React.HTMLAttributes<HTMLElement>;

export const LinearProgress: React.FC<Props> = ({
  className,
  size = "md",
  totalValue = 1,
  value = 0,
  animation = "filling",
  color,
  ...props
}) => {
  const progressBarWidth = Math.floor((value * MAX_PERCENTAGE) / totalValue);
  const progressBarAnimationPercentage =
    animation === "filling"
      ? `${progressBarWidth}%`
      : `${MAX_PERCENTAGE - progressBarWidth}%`;

  return (
    <div
      aria-valuenow={progressBarWidth}
      aria-valuemin={0}
      aria-valuemax={MAX_PERCENTAGE}
      className={cn(
        "relative z-0 flex flex-1 items-center justify-center overflow-hidden min-w-32 bg-element-primary",
        sizeClasses[size],
        className
      )}
      role="progressbar"
      {...props}
    >
      <span
        className={cn(
          "absolute block top-0 left-0 bottom-0 w-full",
          !color && "bg-element-tertiary-active",
          sizeClasses[size]
        )}
        style={{
          width: progressBarAnimationPercentage,
          backgroundColor: color ? `var(--color-${color})` : undefined
        }}
      />
    </div>
  );
};
