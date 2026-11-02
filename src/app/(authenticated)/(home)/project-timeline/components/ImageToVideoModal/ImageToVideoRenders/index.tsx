import { Text } from "@components/Text";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { useImageToVideoGenerations } from "../hooks/useImageToVideoGenerations";
import { useImageToVideoQueueReentry } from "../hooks/useImageToVideoQueueReentry";

import { ImageToVideoRender } from "./ImageToVideoRender";

const GRID_MIN_ITEM_WIDTH = 300;
const GRID_GAP = 20;

interface ImageToVideoRendersProps {
  selectedProjectId: string | undefined;
  containerShotId: string | undefined;
}

export const ImageToVideoRenders: React.FC<ImageToVideoRendersProps> = ({
  selectedProjectId,
  containerShotId
}) => {
  const { t } = useTranslation();
  const { generations } = useImageToVideoGenerations({
    selectedProjectId,
    containerShotId
  });
  const { reentryTrackId } = useImageToVideoQueueReentry({
    selectedProjectId,
    containerShotId
  });
  const hasScrolledToReentryRef = useRef(false);

  // oxlint-disable-next-line custom-react/no-use-effect -- one-time scroll-into-view of the queue-reopened render's card once it exists in the DOM
  useEffect(() => {
    if (hasScrolledToReentryRef.current) return;
    if (!reentryTrackId) return;

    const element = document.getElementById(
      `image-to-video-generation-${reentryTrackId}`
    );
    if (!element) return;

    element.scrollIntoView({ behavior: "smooth", block: "center" });
    hasScrolledToReentryRef.current = true;
  }, [reentryTrackId, generations]);

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-3 p-3">
      <Text component="h3" variant="sm" color="glyph-primary">
        {t("projectTimeline.imageToVideo.generationsTitle.label")}
      </Text>
      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-custom">
        {generations.length === 0 && (
          <Text component="span" variant="sm" color="glyph-tertiary">
            {t("projectTimeline.imageToVideo.emptyState.label")}
          </Text>
        )}
        {generations.length > 0 && (
          <div
            className="grid content-start"
            style={{
              gridTemplateColumns: `repeat(auto-fill, minmax(${GRID_MIN_ITEM_WIDTH}px, 1fr))`,
              gap: GRID_GAP
            }}
          >
            {generations.map((generation) => (
              <ImageToVideoRender
                key={generation.id}
                track={generation}
                selectedProjectId={selectedProjectId}
                containerShotId={containerShotId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
