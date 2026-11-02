import { formatCutTimecode } from "@domains/scriptProject/utils/formatCutTimecode";
import { SHOT_FPS } from "@domains/scriptProject/utils/snapShotFrames";
import {
  generateRulerTicks,
  getRulerUnitMode
} from "@home/components/TimelineList/TimePanel/Ruler/rulerTicks";

export const CUT_RULER_HEIGHT_PX = 36;

type Props = {
  totalDurationFrames: number;
  widthPx: number;
};

export const CutRuler: React.FC<Props> = ({ totalDurationFrames, widthPx }) => {
  const ticks =
    totalDurationFrames > 0 && widthPx > 0
      ? generateRulerTicks({
          durationFrames: totalDurationFrames,
          fps: SHOT_FPS,
          widthPx,
          mode: getRulerUnitMode({
            durationFrames: totalDurationFrames,
            fps: SHOT_FPS
          })
        })
      : [];

  return (
    <div
      className="relative overflow-visible text-glyph-tertiary"
      style={{ height: CUT_RULER_HEIGHT_PX }}
      data-testid="cut-timeline-ruler"
    >
      <div className="absolute inset-0">
        {ticks.map((tick) => (
          <div
            key={`${tick.kind}-${tick.frame}`}
            className="absolute bottom-0.5 flex -translate-x-1/2 flex-col items-center"
            style={{ left: tick.x }}
          >
            {tick.kind === "major" && (
              <span className="whitespace-nowrap text-[11px] leading-[1.3] tracking-[-0.11px] text-glyph-tertiary">
                {formatCutTimecode(tick.frame)}
              </span>
            )}
            <span
              className={
                tick.kind === "major"
                  ? "h-4 w-px bg-glyph-tertiary"
                  : "h-3 w-px bg-glyph-tertiary opacity-60"
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
};
