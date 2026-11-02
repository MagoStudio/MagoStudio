import { ControlLabel } from "@components/ControlLabel";
import { useTranslation } from "react-i18next";

import { useMultiImageSlotUploads } from "./hooks/useMultiImageSlotUploads";
import { ImageUploadSlot } from "./ImageUploadSlot";
import { RenderSettingComponentProps } from "./interface";

export const MultiImageUploader: React.FC<
  RenderSettingComponentProps<string[] | undefined>
> = ({
  name,
  label,
  tooltip,
  isDisabled,
  selectedLayer,
  onValueChange,
  specificConfig
}) => {
  const { t } = useTranslation();
  const {
    imageIds,
    emptySlotCount,
    uploadingSlot,
    uploadProgress,
    uploadErrors,
    handleSlotUpload,
    handleImageDelete,
    handleClearError
  } = useMultiImageSlotUploads({
    name,
    selectedLayer,
    onValueChange,
    specificConfig
  });

  return (
    <div className="flex flex-col gap-1">
      <div className="group">
        <ControlLabel
          label={label}
          labelColor="glyph-tertiary"
          tooltip={tooltip}
        />
      </div>
      <div className="grid grid-cols-3 gap-2 min-w-0">
        {[
          ...imageIds,
          ...Array.from({ length: emptySlotCount }, () => undefined)
        ].map((imageId, index) => (
          <ImageUploadSlot
            key={`slot-${index}`}
            assetId={imageId}
            onUpload={handleSlotUpload(index)}
            onDelete={() => handleImageDelete(index)}
            isDisabled={isDisabled}
            uploadProgress={
              uploadingSlot === index ? uploadProgress : undefined
            }
            uploadError={uploadErrors[index]}
            onClearError={() => handleClearError(index)}
            centerLabel={t("actions.upload_image.label")}
            fluidWidth
            allowMultiple
          />
        ))}
      </div>
    </div>
  );
};
