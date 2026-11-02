import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { LoadingIndicator } from "@components/LoadingIndicator";
import { getTrackErrorMessage } from "@domains/track/utils/getTrackErrorMessage";
import { useShotVideoUrl } from "@home/project-timeline/hooks/useShotVideoUrl";
import { Layer } from "@schemas/layer";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { ImageToVideoRenderErrorState } from "./ImageToVideoRenderErrorState";
import { ImageToVideoRenderFullscreenOverlay } from "./ImageToVideoRenderFullscreenOverlay";

interface ImageToVideoRenderPlayerProps {
  track: Layer;
  assetId: string | undefined;
  isFailed: boolean;
  isAwaitingRenderResult: boolean;
  shouldResolveRenderVideoUrl: boolean;
}

export const ImageToVideoRenderPlayer: React.FC<
  ImageToVideoRenderPlayerProps
> = ({
  track,
  assetId,
  isFailed,
  isAwaitingRenderResult,
  shouldResolveRenderVideoUrl
}) => {
  const { t } = useTranslation();
  const videoUrl = useShotVideoUrl(
    shouldResolveRenderVideoUrl ? assetId : undefined,
    track.id
  );
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

  if (isFailed) {
    return (
      <ImageToVideoRenderErrorState
        errorMessage={getTrackErrorMessage(track)}
      />
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded bg-black">
      {videoUrl ? (
        <>
          <video
            key={track.id}
            src={videoUrl}
            controls
            className="absolute inset-0 h-full w-full object-contain"
          />
          <IconActionButton
            aria-label={t("actions.toggle_fullscreen.label")}
            icon={<Icon iconSet="24" iconName="fullscreen" />}
            variant="dark"
            className="absolute top-2 right-2"
            onPress={() => setIsFullscreenOpen(true)}
          />
        </>
      ) : (
        isAwaitingRenderResult && (
          <div className="absolute inset-0 flex items-center justify-center">
            <LoadingIndicator className="size-6" />
          </div>
        )
      )}
      {isFullscreenOpen && videoUrl && (
        <ImageToVideoRenderFullscreenOverlay
          videoUrl={videoUrl}
          trackName={track.name}
          onClose={() => setIsFullscreenOpen(false)}
        />
      )}
    </div>
  );
};
