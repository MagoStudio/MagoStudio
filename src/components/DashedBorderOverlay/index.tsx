import { cn } from "@utils";

const CORNER_RADIUS_PX_BY_SIZE = {
  xs: "4",
  sm: "8",
  lg: "20"
} as const;

const DESIGN_SYSTEM_DASH_PATTERN = "8 8";

const STROKE_WIDTH_PX = 1;
const INSIDE_ALIGNED_STROKE_INSET_PX = STROKE_WIDTH_PX / 2;

type Props = {
  cornerSize?: keyof typeof CORNER_RADIUS_PX_BY_SIZE;
  className?: string;
};

export const DashedBorderOverlay: React.FC<Props> = ({
  cornerSize = "xs",
  className
}) => {
  const radius = CORNER_RADIUS_PX_BY_SIZE[cornerSize];

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <rect
        x={INSIDE_ALIGNED_STROKE_INSET_PX}
        y={INSIDE_ALIGNED_STROKE_INSET_PX}
        width={`calc(100% - ${STROKE_WIDTH_PX}px)`}
        height={`calc(100% - ${STROKE_WIDTH_PX}px)`}
        rx={radius}
        ry={radius}
        fill="none"
        strokeWidth={STROKE_WIDTH_PX}
        strokeDasharray={DESIGN_SYSTEM_DASH_PATTERN}
        className={cn(
          "stroke-glyph-disabled",
          "group-hover:stroke-element-success",
          "group-data-[drop-target]:stroke-element-success",
          className
        )}
      />
    </svg>
  );
};
