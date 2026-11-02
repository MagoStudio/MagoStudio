import { TRACK_WIDTH_WITHOUT_BORDER } from "@config/constants";
import { useShotMaxFrames } from "@domains/shot/useShotMaxFrames";
import { trackRangeAtom } from "@store/atoms/trackRangeAtom";
import { useAtomValue } from "jotai";

const TRACK_LEFT_BUTTONS_WIDTH = 92;

export const TrackRangeOverlay: React.FC = () => {
  const trackRange = useAtomValue(trackRangeAtom);
  const shotMaxFrames = useShotMaxFrames();

  const [rangeMin, rangeMax] = trackRange;

  if (!shotMaxFrames || rangeMax === 0 || rangeMin >= rangeMax) {
    return null;
  }

  const getPixelOffsetFromFrames = (frames: number): number => {
    if (shotMaxFrames === 0) return 0;
    return (
      (frames / shotMaxFrames) * TRACK_WIDTH_WITHOUT_BORDER +
      TRACK_LEFT_BUTTONS_WIDTH
    );
  };

  const rangeStart = getPixelOffsetFromFrames(rangeMin);
  const rangeEnd = getPixelOffsetFromFrames(rangeMax);
  const rangeWidth = rangeEnd - rangeStart;

  return (
    <>
      <div
        data-testid="frame-range-overlay"
        className="absolute top-[20px] bottom-0 bg-[rgba(217,_217,_217,_0.04)] pointer-events-none z-30 h-lvh"
        style={{
          left: `${rangeStart}px`,
          width: `${rangeWidth}px`
        }}
      />
      <div
        className="absolute top-[21px] bg-glyph-stroke-2 pointer-events-none z-30 w-px min-h-lvh"
        style={{
          left: `${rangeStart}px`
        }}
      />
      <div
        className="absolute top-[21px] bg-glyph-stroke-2 pointer-events-none z-30 w-px min-h-lvh"
        style={{
          left: `${rangeEnd}px`
        }}
      />
    </>
  );
};
