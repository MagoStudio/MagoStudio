import { ControlLabel } from "@components/ControlLabel";
import { GhostButton } from "@components/GhostButton";
import { ImageThumbnail } from "@components/ImageThumbnail";
import { Text } from "@components/Text";
import { useImageAsset } from "@domains/asset/useImageAsset";
import { useUploadReferenceImage } from "@domains/asset/useUploadReferenceImage";
import { truncateFileNameFixed } from "@home/components/fileUpload/helpers/truncateFileName";
import { SourcesDndContainer } from "@home/components/sources/SourcesDndContainer";
import { useTool } from "@hooks/tool/useTool";
import { useTranslation } from "react-i18next";

import { RenderSettingComponentProps } from "../interface";

const DEFAULT_MAX_FILENAME_LENGTH = 16;

export const EditFirstFrameInput: React.FC<
  RenderSettingComponentProps<string | undefined>
> = ({ label, tooltip, tooltipImage, value, isDisabled }) => {
  const { t } = useTranslation();
  const { setTool } = useTool();

  const { data: imageAssetData, isLoading: isImageAssetLoading } =
    useImageAsset({ assetId: value, enabled: !!value });

  const { isPending: isUploading } = useUploadReferenceImage();

  const hasImage = !!imageAssetData?.urlToUse && !!value;
  const isLoadingImage = isUploading || (!!value && isImageAssetLoading);
  const showEmptyState = !hasImage && !isLoadingImage;

  const openEditFrameModal = () => {
    setTool("edit-frame");
  };

  return (
    <div className="group flex flex-col gap-2">
      <ControlLabel
        label={label}
        labelColor="glyph-tertiary"
        tooltip={tooltip}
        tooltipImage={tooltipImage}
      />
      {showEmptyState && (
        <div className="grid grid-cols-2 gap-2">
          <GhostButton
            className="w-full"
            isDisabled={isDisabled}
            onPress={openEditFrameModal}
            type="button"
          >
            {t("inpainting.basic.edit_first_frame.edit_button.label")}
          </GhostButton>
          <SourcesDndContainer
            isDisabled={isDisabled}
            variant="button"
            className="w-full"
            label={t("inpainting.basic.edit_first_frame.upload_button.label")}
          />
        </div>
      )}
      {!showEmptyState && (
        <div className="flex flex-col gap-1.5 items-start">
          <ImageThumbnail
            src={imageAssetData?.urlToUse}
            name={imageAssetData?.asset?.name}
            isLoading={isLoadingImage}
            classNames={{ root: "w-full h-auto aspect-[154/84]" }}
          />
          {imageAssetData?.asset?.name && (
            <Text
              className="break-all"
              color="glyph-tertiary"
              disabled={isDisabled}
              select="none"
              variant="xs"
            >
              {truncateFileNameFixed(
                imageAssetData.asset.name,
                DEFAULT_MAX_FILENAME_LENGTH,
                0
              )}
            </Text>
          )}
        </div>
      )}
    </div>
  );
};
