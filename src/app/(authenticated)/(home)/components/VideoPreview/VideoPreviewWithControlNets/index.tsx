/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect for external sync */

import { Switcher } from "@components/Switcher";
import { useControlNetOptions } from "@domains/asset/useControlNetOptions";
import { useVideoAsset } from "@domains/asset/useVideoAsset";
import { getTrackAssetId } from "@domains/track/utils/getTrackAssetId";
import { CropOverlay } from "@home/components/VideoPreview/CropOverlay";
import { PreviewMessage } from "@home/components/VideoPreview/PreviewMessage";
import { VideoMediaPlayer } from "@home/components/VideoPreview/VideoMediaPlayer";
import { ViewportPanZoom } from "@home/components/VideoPreview/ViewportPanZoom";
import { Layer } from "@schemas/layer";
import { isViewportFullscreenOpenAtom } from "@store/atoms";
import { cn } from "@utils";
import { useAtomValue } from "jotai";
import { useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  selectedTrack: Layer;
  isVideoLoading: boolean;
  isVideoAvailable: boolean;
  setIsLoading: (isLoading: boolean) => void;
  switcherContainer?: HTMLDivElement | null;
  selectedVideoType?: string;
  onSelectedVideoTypeChange?: (value: string) => void;
}

export const VideoPreviewWithControlNets: React.FC<Props> = ({
  selectedTrack,
  isVideoLoading,
  isVideoAvailable,
  setIsLoading,
  switcherContainer,
  selectedVideoType,
  onSelectedVideoTypeChange
}) => {
  const { isPending } = useVideoAsset({
    assetId: getTrackAssetId(selectedTrack),
    selectedLayerId: selectedTrack.id
  });
  const isLoading = isVideoLoading || isPending || !isVideoAvailable;

  const controlNetOverride = selectedTrack.data.controlNetOverride;

  const [localSelectedVideoType, setLocalSelectedVideoType] = useState("video");

  const [lastTrackId, setLastTrackId] = useState(selectedTrack.id);
  if (selectedTrack.id !== lastTrackId) {
    setLastTrackId(selectedTrack.id);
    if (!onSelectedVideoTypeChange) {
      setLocalSelectedVideoType("video");
    }
  }

  const selectedVideoToDisplay = selectedVideoType ?? localSelectedVideoType;
  const handleSelectedVideoTypeChange =
    onSelectedVideoTypeChange ?? setLocalSelectedVideoType;

  const { options: variantsOptions, controlNets: availableControlNets } =
    useControlNetOptions({ track: selectedTrack });

  const switcher =
    variantsOptions.length > 1 ? (
      <Switcher
        options={variantsOptions}
        onOptionClick={(option) => handleSelectedVideoTypeChange(option.value)}
        isOptionSelected={(option) => option.value === selectedVideoToDisplay}
      />
    ) : null;

  const overrideVideoSrc =
    controlNetOverride && selectedVideoToDisplay === controlNetOverride.name
      ? controlNetOverride.video
      : availableControlNets?.find(
          (controlNet) => controlNet.name === selectedVideoToDisplay
        )?.video;
  const isViewportFullscreenOpen = useAtomValue(isViewportFullscreenOpenAtom);

  return (
    <div className={"w-full h-full relative"}>
      {isLoading && <PreviewMessage variant="loading" />}

      {switcher && switcherContainer === undefined && (
        <div
          className={cn(
            "absolute right-2 flex justify-end z-10",
            isViewportFullscreenOpen ? "top-11" : "top-6"
          )}
        >
          {switcher}
        </div>
      )}
      {switcher &&
        switcherContainer &&
        createPortal(switcher, switcherContainer)}
      <ViewportPanZoom>
        <VideoMediaPlayer
          key={selectedTrack.id}
          isLoading={isVideoLoading}
          setIsLoading={setIsLoading}
          selectedLayer={selectedTrack}
          overrideVideoSrc={overrideVideoSrc}
        />
        <CropOverlay selectedTrack={selectedTrack} />
      </ViewportPanZoom>
    </div>
  );
};
