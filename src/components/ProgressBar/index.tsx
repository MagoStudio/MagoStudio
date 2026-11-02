import { GlyphPalette } from "@styles/types";
import { cn } from "@utils";

const MAX_PERCENTAGE = 100;
const MIN_PERCENTAGE = 0;

const DESIGN_SYSTEM_GLOW_BY_COLOR: Partial<Record<GlyphPalette, string>> = {
  "glyph-warning": "0 0 14px rgba(255, 237, 144, 0.6)",
  "glyph-success": "0 0 12px rgba(51, 255, 0, 0.62)",
  "glyph-error": "0 0 12px rgba(229, 69, 69, 0.62)"
};

type Props = {
  progress: number;
  color?: GlyphPalette;
  isFillPulsing?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

export const ProgressBar: React.FC<Props> = ({
  progress,
  color = "glyph-warning",
  isFillPulsing = false,
  ...props
}) => {
  const clampedProgress = Math.min(
    MAX_PERCENTAGE,
    Math.max(MIN_PERCENTAGE, progress)
  );
  const glow =
    DESIGN_SYSTEM_GLOW_BY_COLOR[color] ??
    `0 0 14px 1px var(--color-${color}-opacity-80)`;

  return (
    <div
      className="relative w-full min-w-20 h-3 rounded-full bg-element-tertiary"
      role="progressbar"
      aria-valuenow={clampedProgress}
      aria-valuemin={MIN_PERCENTAGE}
      aria-valuemax={MAX_PERCENTAGE}
      {...props}
    >
      <div
        className={cn(
          "absolute top-1 left-1 h-1 rounded-full transition-all ease-in-out",
          isFillPulsing && "animate-status-pulse"
        )}
        style={{
          width: `calc(${clampedProgress}% - 8px)`,
          backgroundColor: `var(--color-${color})`,
          boxShadow: glow
        }}
      />
    </div>
  );
};
