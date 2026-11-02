import { Skeleton } from "@components/Skeleton";
import {
  trackHeightSize,
  timelineTrackContainerWidth
} from "@styles/themeValues";

export const SkeletonTrackList: React.FC = () => {
  return (
    <div className="relative">
      <div className="relative flex flex-col pt-3">
        <div className="relative flex mb-3">
          <div className="flex flex-col w-full relative">
            <Skeleton
              className="left-[var(--width-timeline-slider-thumb)]"
              height={trackHeightSize}
              width={timelineTrackContainerWidth}
            />
          </div>
        </div>
        {Array.from({ length: 20 }, (_, index) => (
          <div key={index} className="relative flex mb-3">
            <div className="flex flex-col w-full relative">
              <Skeleton
                className="left-[var(--width-timeline-slider-thumb)]"
                height={trackHeightSize}
                width={timelineTrackContainerWidth}
              />
              <Skeleton
                className="mt-2 ml-2"
                height="1rem"
                width={190}
                variant="rounded"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
