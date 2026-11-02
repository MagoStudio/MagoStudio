import { useVideoAsset } from "@domains/asset/useVideoAsset";
import { useVideoFrame } from "@domains/asset/useVideoFrame";
import { getVideoAssetUrl } from "@domains/asset/utils/getVideoAssetUrl";

import { BulkRenderingShotCard } from "./BulkRenderingShotCard";
import { BulkRenderingShotCardSource } from "./types";
import { getBulkRenderingShotCardState } from "./utils/getBulkRenderingShotCardState";

const RENDER_FIRST_FRAME_NUMBER = 0;

interface Props {
  shot: BulkRenderingShotCardSource;
  isVideoStep: boolean;
  isImageResultLoading: boolean;
}

export const BulkRenderingShotCardContainer: React.FC<Props> = ({
  shot,
  isVideoStep,
  isImageResultLoading
}) => {
  const directPosterUrl = shot.videoResultRender?.posterUrl;
  const directVideoUrl = shot.videoResultRender?.videoUrl;
  const { data: videoResultFrameUrl, isLoading: isVideoResultFrameLoading } =
    useVideoFrame({
      assetId: shot.videoResultRender?.renderAssetId,
      fps: shot.videoResultRender?.renderFps,
      frameNumber: RENDER_FIRST_FRAME_NUMBER,
      enabled: !!shot.videoResultRender && !directPosterUrl
    });

  const { data: videoResultAsset } = useVideoAsset({
    assetId: shot.videoResultRender?.renderAssetId,
    enabled: isVideoStep && !!shot.videoResultRender && !directVideoUrl
  });

  const thumbnailUrl = isVideoStep
    ? (directPosterUrl ?? videoResultFrameUrl)
    : shot.imageResultUrl;
  const isResultPreviewLoading = isVideoStep
    ? isVideoResultFrameLoading
    : isImageResultLoading;

  return (
    <BulkRenderingShotCard
      shot={{
        shotId: shot.shotId,
        shotName: shot.shotName,
        state: getBulkRenderingShotCardState({
          status: shot.status,
          assetUrl: thumbnailUrl,
          isResultPreviewLoading
        }),
        thumbnailUrl,
        videoUrl: isVideoStep
          ? (directVideoUrl ?? getVideoAssetUrl(videoResultAsset))
          : undefined
      }}
      isVideoStep={isVideoStep}
    />
  );
};
