/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect for external sync */

import { generateFilmstrip } from "@app/services/mediaBunny";
import { useEffect, useState } from "react";
import { useDebounceValue, useResizeObserver } from "usehooks-ts";

const TIMELINE_HEIGHT = 24;
const RESIZE_DEBOUNCE_MS = 200;

interface TimelineThumbnailsProps {
  timelineRef: React.RefObject<HTMLDivElement | null>;
  videoFile?: File | null;
  videoDuration: number;
  fps?: number;
}

export const TimelineThumbnails: React.FC<TimelineThumbnailsProps> = ({
  timelineRef,
  videoFile,
  videoDuration,
  fps
}) => {
  const [filmstripUrl, setFilmstripUrl] = useState<string | null>(null);
  const { width = 0 } = useResizeObserver({
    ref: timelineRef as React.RefObject<HTMLDivElement>,
    box: "border-box"
  });
  const [debouncedWidth] = useDebounceValue(
    Math.round(width),
    RESIZE_DEBOUNCE_MS
  );

  /* eslint-disable react-you-might-not-need-an-effect/no-event-handler, react-you-might-not-need-an-effect/no-derived-state -- async media generation into state, not derivable in render */
  useEffect(() => {
    const generateFilmstripForTimeline = async () => {
      if (!videoFile || debouncedWidth <= 0 || videoDuration <= 0) {
        return;
      }

      try {
        const filmstrip = await generateFilmstrip(videoFile, {
          fps,
          width: debouncedWidth,
          frameHeight: TIMELINE_HEIGHT
        });

        setFilmstripUrl(filmstrip);
      } catch (error) {
        console.error("Failed to generate filmstrip:", error);
        setFilmstripUrl(null);
      }
    };

    void generateFilmstripForTimeline();
  }, [videoFile, videoDuration, fps, debouncedWidth]);
  /* eslint-enable react-you-might-not-need-an-effect/no-event-handler, react-you-might-not-need-an-effect/no-derived-state */

  if (!filmstripUrl) {
    return null;
  }

  return (
    <img
      src={filmstripUrl}
      alt="Video filmstrip"
      className="absolute inset-0 w-full h-full object-fill pointer-events-none"
    />
  );
};
