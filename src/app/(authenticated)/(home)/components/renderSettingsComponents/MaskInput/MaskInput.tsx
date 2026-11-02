import { ControlLabel } from "@components/ControlLabel";
import { GhostButton } from "@components/GhostButton";
import { ImageThumbnail } from "@components/ImageThumbnail";
import { useVideoFrame } from "@domains/asset/useVideoFrame";
import { useFilteredAndSortedTracks } from "@domains/track/useFilteredAndSortedTracks";
import { getTrackAssetData } from "@domains/track/utils/getTrackAssetData";
import { getTrackAssetId } from "@domains/track/utils/getTrackAssetId";
import { useTool } from "@hooks/tool/useTool";
import { useTranslation } from "react-i18next";

import { RenderSettingComponentProps } from "../interface";

export const MaskInput: React.FC<
  RenderSettingComponentProps<string | undefined>
> = ({ label, tooltip, tooltipImage, value, isDisabled }) => {
  const { t } = useTranslation();
  const { setTool } = useTool();

  const { data } = useFilteredAndSortedTracks();
  const maskTrack = value
    ? data.tracks.find((track) => track.id === value)
    : undefined;
  const maskAssetId = getTrackAssetId(maskTrack);
  const maskFps = getTrackAssetData(maskTrack)?.fps;

  const { data: maskFrame, isLoading: isFrameLoading } = useVideoFrame({
    assetId: maskAssetId,
    enabled: !!maskAssetId,
    frameNumber: 0,
    fps: maskFps
  });

  const hasMask = !!maskTrack;
  const openMaskTab = () => {
    setTool("mask");
  };

  return (
    <div className="group flex flex-col gap-2">
      <ControlLabel
        label={label}
        labelColor="glyph-tertiary"
        tooltip={tooltip}
        tooltipImage={tooltipImage}
      />
      {!hasMask && (
        <GhostButton
          className="w-full"
          isDisabled={isDisabled}
          onPress={openMaskTab}
          type="button"
        >
          {t("inpainting.basic.mask_input.create_mask_button.label")}
        </GhostButton>
      )}
      {hasMask && (
        <ImageThumbnail
          src={maskFrame}
          name={maskTrack?.name}
          isLoading={isFrameLoading}
          classNames={{ root: "w-full h-auto aspect-[154/84]" }}
        />
      )}
    </div>
  );
};
