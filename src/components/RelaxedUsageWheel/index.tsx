import { Tooltip } from "@components/Tooltip";
import { cn } from "@utils";
import { useTranslation } from "react-i18next";

interface Props {
  usedPct: number;
  className?: string;
}

const SIZE = 18;
const STROKE = 2.5;
const RADIUS = (SIZE - STROKE) / 2;
const CENTER = SIZE / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const MAX_PCT = 100;
const DANGER_THRESHOLD_PCT = 80;

export function RelaxedUsageWheel({ usedPct, className }: Props) {
  const { t } = useTranslation();

  const clampedPct = Math.min(MAX_PCT, Math.max(0, usedPct));
  const dashOffset = CIRCUMFERENCE * (1 - clampedPct / MAX_PCT);
  const roundedPct = Math.round(clampedPct);
  const arcColorClass =
    clampedPct > DANGER_THRESHOLD_PCT
      ? "stroke-severity-error"
      : "stroke-glyph-action-main";

  const usageLabel = t(
    "notifications.payment_flow_relaxed_usage_tooltip.description",
    { pct: roundedPct }
  );

  return (
    <Tooltip placement="bottom" textContent={usageLabel}>
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className={cn("shrink-0", className)}
        role="img"
        aria-label={usageLabel}
      >
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-glyph-disabled opacity-40"
        />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${CENTER} ${CENTER})`}
          className={arcColorClass}
        />
      </svg>
    </Tooltip>
  );
}
