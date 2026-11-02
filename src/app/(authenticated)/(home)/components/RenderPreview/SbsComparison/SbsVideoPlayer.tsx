import { PERCENTAGE_MULTIPLIER } from "@constants";
import { toNormalizedCropRect } from "@domains/renders/utils/cropRect";
import { useGetVideoTrackReadiness } from "@domains/track/useGetVideoTrackReadiness";
import { getTrackCropSettings } from "@domains/track/utils/getTrackCropSettings";
import { VideoPreviewWithControlNets } from "@home/components/VideoPreview/VideoPreviewWithControlNets";
import { Layer } from "@schemas/layer";
import { videosLoadingAtom } from "@store/atoms";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback } from "react";

interface Props {
  selectedLayer: Layer;
  switcherContainer: HTMLDivElement | null;
  selectedVideoType: string;
  onSelectedVideoTypeChange: (value: string) => void;
}

export const SbsVideoPlayer: React.FC<Props> = ({
  selectedLayer,
  switcherContainer,
  selectedVideoType,
  onSelectedVideoTypeChange
}) => {
  const videosLoading = useAtomValue(videosLoadingAtom);
  const setVideosLoading = useSetAtom(videosLoadingAtom);
  const { isVideoAvailable } = useGetVideoTrackReadiness();

  const isVideoLoading = selectedLayer?.id
    ? videosLoading[selectedLayer.id]
    : false;

  const setIsLoading = useCallback(
    (isLoading: boolean) => {
      const videoId = selectedLayer?.id || "";
      setVideosLoading((prev) => ({
        ...prev,
        [videoId]: isLoading
      }));
    },
    [selectedLayer?.id, setVideosLoading]
  );

  const player = (
    <VideoPreviewWithControlNets
      selectedTrack={selectedLayer}
      isVideoLoading={!!isVideoLoading}
      isVideoAvailable={isVideoAvailable}
      setIsLoading={setIsLoading}
      switcherContainer={switcherContainer}
      selectedVideoType={selectedVideoType}
      onSelectedVideoTypeChange={onSelectedVideoTypeChange}
    />
  );

  const cropSettings = getTrackCropSettings(selectedLayer);

  if (!cropSettings) return player;

  const [sourceWidth, sourceHeight] = cropSettings.sourceVideoDimensions;
  const normalizedCrop = toNormalizedCropRect({
    crop: cropSettings.cropCoordinates,
    sourceWidth,
    sourceHeight
  });

  return (
    <div className="relative h-full w-full bg-black">
      <div
        className="absolute"
        style={{
          left: `${normalizedCrop.x * PERCENTAGE_MULTIPLIER}%`,
          top: `${normalizedCrop.y * PERCENTAGE_MULTIPLIER}%`,
          width: `${normalizedCrop.width * PERCENTAGE_MULTIPLIER}%`,
          height: `${normalizedCrop.height * PERCENTAGE_MULTIPLIER}%`
        }}
      >
        {player}
      </div>
    </div>
  );
};
