import { Skeleton } from "@components/Skeleton";
import { Text } from "@components/Text";
import { LongFormRunViewShot } from "@domains/longFormRun/useLongFormRunView";
import { PlanStatus } from "@schemas/plan";
import { cn } from "@utils";
import { useTranslation } from "react-i18next";

import { useDragToScroll } from "../hooks/useDragToScroll";
import { useExclusiveVideoPlayback } from "../hooks/useExclusiveVideoPlayback";

import { LongFormDownloadAllButton } from "./LongFormDownloadAllButton";
import { LongFormDownloadEditButton } from "./LongFormDownloadEditButton";
import { LongFormShotCard } from "./LongFormShotCard";

const SHIMMER_PLACEHOLDER_COUNT = 3;

interface LongFormShotListProps {
  hasShotsChildSpawned: boolean;
  isLoading: boolean;
  isRunActive: boolean;
  status: PlanStatus | undefined;
  shots: LongFormRunViewShot[];
  projectName: string | undefined;
}

const didRunFailWithNoShots = (status: PlanStatus | undefined): boolean =>
  status === "FAILED" || status === "CANCELLED";

export const LongFormShotList: React.FC<LongFormShotListProps> = ({
  hasShotsChildSpawned,
  isLoading,
  isRunActive,
  status,
  shots,
  projectName
}) => {
  const { t } = useTranslation();
  const { scrollContainerRef, isDragging, dragHandlers } = useDragToScroll();
  const { pauseOtherVideos } = useExclusiveVideoPlayback(scrollContainerRef);

  const showsPlaceholderCards =
    isLoading || (isRunActive && !hasShotsChildSpawned);

  if (showsPlaceholderCards) {
    return (
      <div
        data-testid="long-form-shot-list-loading"
        className="flex h-full items-start gap-4 p-3"
      >
        {Array.from({ length: SHIMMER_PLACEHOLDER_COUNT }).map((_, index) => (
          <Skeleton
            key={index}
            className="h-[calc(100vh-10rem)] w-[calc((100vh-10rem)*9/16)] rounded-lg"
          />
        ))}
      </div>
    );
  }

  if (!hasShotsChildSpawned) {
    return (
      <div
        data-testid="long-form-shot-list-empty"
        className="flex h-full items-center justify-center p-6"
      >
        <Text component="span" variant="sm" color="glyph-tertiary">
          {didRunFailWithNoShots(status)
            ? t("longForm.emptyState.failed.label")
            : t("longForm.emptyState.label")}
        </Text>
      </div>
    );
  }

  return (
    <div
      data-testid="long-form-shot-list"
      className="flex h-full min-h-0 flex-col"
    >
      <div className="flex shrink-0 justify-end gap-2 px-3 pt-3">
        <LongFormDownloadAllButton shots={shots} />
        <LongFormDownloadEditButton shots={shots} projectName={projectName} />
      </div>
      <div
        ref={scrollContainerRef}
        data-testid="long-form-shot-list-row"
        className={cn(
          "min-h-0 flex-1 overflow-x-scroll overflow-y-hidden scrollbar-contrast pt-3 pb-8 pl-3",
          isDragging ? "cursor-grabbing select-none" : "cursor-grab"
        )}
        {...dragHandlers}
      >
        <div className="flex w-max items-start gap-4">
          {shots.map((shot, index) => (
            <LongFormShotCard
              key={shot.id}
              index={index}
              label={shot.label}
              cardState={shot.cardState}
              failure={shot.failure}
              renderTrack={shot.readyRenderTrack}
              onVideoPlay={pauseOtherVideos}
            />
          ))}
          <div aria-hidden className="w-4 shrink-0" />
        </div>
      </div>
    </div>
  );
};
