import { cn } from "@utils";

const PLAYHEAD_HEAD_CLIP_PATH =
  "polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%)";

type Props = {
  ref: React.RefObject<HTMLDivElement | null>;
  isCutPlaying: boolean;
};

export const CutPlayhead: React.FC<Props> = ({ ref, isCutPlaying }) => (
  <div
    ref={ref}
    className="pointer-events-none absolute bottom-0 top-0 w-0.5"
    style={{ left: 0 }}
    data-testid="cut-timeline-playhead"
  >
    <div
      className={cn(
        "absolute bottom-0 top-0 w-0.5",
        isCutPlaying ? "bg-glyph-error" : "bg-glyph-action-secondary"
      )}
    />
    <div
      className={cn(
        "absolute -left-[5px] top-0 h-4 w-[12px]",
        isCutPlaying ? "bg-glyph-error" : "bg-glyph-action-secondary"
      )}
      style={{ clipPath: PLAYHEAD_HEAD_CLIP_PATH }}
    />
  </div>
);
