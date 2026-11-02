import { Badge } from "@components/Badge";
import { ControlLabel } from "@components/ControlLabel";
import { useTranslation } from "react-i18next";

import { useMultiImageSlotUploads } from "./hooks/useMultiImageSlotUploads";
import { ImageUploadSlot } from "./ImageUploadSlot";
import { RenderSettingComponentProps } from "./interface";

export const MultiImageTileUploader: React.FC<
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
      <div className="flex flex-wrap gap-2">
        {[
          ...imageIds,
          ...Array.from({ length: emptySlotCount }, () => undefined)
        ].map((imageId, index) => (
          <div key={`slot-${index}`} className="relative">
            <ImageUploadSlot
              assetId={imageId}
              onUpload={handleSlotUpload(index)}
              onDelete={() => handleImageDelete(index)}
              isDisabled={isDisabled}
              uploadProgress={
                uploadingSlot === index ? uploadProgress : undefined
              }
              uploadError={uploadErrors[index]}
              onClearError={() => handleClearError(index)}
              allowMultiple
            />
            {imageId && (
              <Badge className="pointer-events-none absolute top-1 left-1">
                {t("titles.reference_image_slot.pictureTag", {
                  number: index + 1
                })}
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
