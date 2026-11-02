import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { trackingWithProjectId } from "@hooks/tracking/trackingUtils";
import { cn } from "@utils";
import {
  Slider as AriaSlider,
  SliderThumb,
  SliderTrack
} from "react-aria-components/Slider";
type Props = {
  ariaLabel?: string;
  className?: string;
  isDisabled?: boolean;
  onChange?: (value: number) => void;
  onChangeEnd?: (value: number) => void;
  isActive?: boolean;
  maxValue?: number;
  minValue?: number;
  size?: "sm" | "md";
  skeleton?: boolean;
  step?: number;
  value?: number;
};

const PERCENT_MULTIPLIER = 100;

const skeletonTrackGradient = {
  sm: "bg-[image:linear-gradient(90deg,var(--color-element-primary-active)_0%,#383838_50%,var(--color-element-primary-active)_100%)]",
  md: "bg-[image:linear-gradient(90deg,var(--color-surface-secondary)_34%,var(--color-element-primary)_60%,var(--color-surface-secondary)_86%)]"
} as const;

const skeletonTrackRestingColor = {
  sm: "bg-element-primary-active",
  md: "bg-surface-secondary"
} as const;

const sizeClasses = {
  container: {
    sm: "h-6",
    md: "h-8"
  },
  rail: {
    sm: "h-4 rounded-[4px]",
    md: "h-8 rounded-[4px]"
  },
  thumb: {
    sm: "h-5 w-1.5",
    md: "h-9 w-1.5 shadow-[-1px_0px_2px_0px_rgba(28,25,34,0.16)]"
  },
  track: {
    sm: "h-4 rounded-[4px]",
    md: "h-8 rounded-[4px]"
  }
};

export const Slider: React.FC<Props> = ({
  ariaLabel,
  className,
  isDisabled,
  onChange,
  onChangeEnd,
  isActive,
  maxValue,
  minValue,
  size = "md",
  skeleton,
  step,
  value
}) => {
  const selectedProjectId = useSelectedProjectId();

  const handleChangeEnd = (newValue: number) => {
    onChangeEnd?.(newValue);
    trackingWithProjectId.timelineActions.rangeSelector(
      newValue,
      selectedProjectId
    );
  };

  if (skeleton) {
    return (
      <div
        className={cn(
          "flex items-center px-1 w-full",
          sizeClasses.container[size],
          className
        )}
      >
        <div className="relative w-full">
          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 w-full overflow-hidden",
              skeletonTrackRestingColor[size],
              sizeClasses.rail[size]
            )}
          >
            <div
              className={cn(
                "absolute inset-0 animate-mago-shimmer",
                skeletonTrackGradient[size]
              )}
            />
          </div>
          {size === "sm" && (
            <>
              <div
                className={cn(
                  "absolute top-1/2 left-0 -translate-y-1/2 w-1/2 bg-element-tertiary rounded-l-[4px]",
                  sizeClasses.track[size]
                )}
              />
              <div
                className={cn(
                  "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded bg-glyph-disabled",
                  sizeClasses.thumb[size]
                )}
              />
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <AriaSlider
      aria-label={ariaLabel || "Slider"}
      className={cn("group flex items-center px-1 w-full", className)}
      isDisabled={isDisabled}
      maxValue={maxValue}
      minValue={minValue}
      onChange={onChange}
      onChangeEnd={handleChangeEnd}
      step={step}
      value={value}
    >
      <SliderTrack
        className={cn(
          "relative w-full min-w-12 cursor-pointer",
          sizeClasses.container[size],
          "group-data-disabled:pointer-events-none group-data-disabled:cursor-default"
        )}
      >
        {({ state }) => {
          const trackWidth = state.getThumbPercent(0) * PERCENT_MULTIPLIER;
          return (
            <>
              <div
                className={cn(
                  "absolute top-1/2 -left-1 -right-1 -translate-y-1/2 bg-element-primary-active",
                  sizeClasses.rail[size]
                )}
              />
              <div
                className={cn(
                  "absolute top-1/2 -left-1 -translate-y-1/2 transition-colors duration-300 ease-in delay-100",
                  "group-hover:bg-element-tertiary-active",
                  "group-data-dragging:bg-element-tertiary-active",
                  "group-data-disabled:group-hover:bg-element-tertiary",
                  isActive
                    ? "bg-element-tertiary-active"
                    : "bg-element-tertiary",
                  sizeClasses.track[size]
                )}
                style={{ width: `calc(${trackWidth}% + 0.25rem)` }}
              />
              <SliderThumb
                className={cn(
                  "absolute top-1/2 rounded transition-colors duration-300 ease-in delay-100 outline-hidden",
                  "bg-glyph-secondary group-hover:bg-glyph-primary",
                  "group-data-disabled:bg-glyph-tertiary group-data-disabled:group-hover:bg-glyph-tertiary",
                  sizeClasses.thumb[size]
                )}
              />
            </>
          );
        }}
      </SliderTrack>
    </AriaSlider>
  );
};
