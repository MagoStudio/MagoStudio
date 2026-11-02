import { useUploadReferenceImage } from "@domains/asset/useUploadReferenceImage";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { SourceImageType } from "@domains/renders/types";
import { useUpdateTrack } from "@domains/track/useUpdateTrack";
import { ImageUploadDropZone } from "@home/components/fileUpload/ImageUploadDropZone";
import { useLatestRef } from "@hooks/useLatestRef";
import { Layer } from "@schemas/layer";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { getUploadErrorMessage, translateErrorMessage } from "@utils";
import { useAtomValue, useSetAtom } from "jotai";
import { ChangeEvent, useState } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  isDisabled?: boolean;
  selectedLayer?: Layer;
  variant?: "default" | "button";
  label?: string;
  subtitle?: string;
  className?: string;
  role?: SourceImageType;
  keyFrameIndex?: number;
}

export const SourcesDndContainer: React.FC<Props> = ({
  isDisabled = false,
  selectedLayer,
  variant = "default",
  label,
  subtitle,
  className,
  role = "reference_frame",
  keyFrameIndex = 0
}) => {
  const { t } = useTranslation();
  const selectedProjectId = useSelectedProjectId();
  const { sourcesAtom } = useRenderSettingsAtoms();
  const setSources = useSetAtom(sourcesAtom);
  const currentSources = useAtomValue(sourcesAtom);
  const { isPending: isTrackUpdating } = useUpdateTrack();

  const keyFrameIndexRef = useLatestRef(keyFrameIndex);

  const [uploadError, setUploadError] = useState<string>("");

  const { mutateAsync: uploadReferenceImage, uploadProgress } =
    useUploadReferenceImage();

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!selectedProjectId) return;

    setUploadError("");

    try {
      const assetId = await uploadReferenceImage({
        file,
        selectedLayerId: selectedLayer?.id,
        projectId: selectedProjectId
      });
      if (!assetId) {
        setUploadError(
          translateErrorMessage("upload_button_file_corrupted", t)
        );
        return;
      }
      const withoutCurrent = currentSources.filter(
        (entry) => entry.type !== role
      );
      const newEntry =
        role === "key_frame"
          ? {
              asset_id: assetId,
              type: "key_frame" as const,
              index: keyFrameIndexRef.current
            }
          : { asset_id: assetId, type: role };
      setSources([newEntry, ...withoutCurrent]);
    } catch (error) {
      console.error("Error uploading image:", error);
      setUploadError(translateErrorMessage(getUploadErrorMessage(error), t));
    }
  };

  const handleClearError = () => {
    setUploadError("");
  };

  return (
    <ImageUploadDropZone
      disabled={isDisabled || isTrackUpdating}
      onClearError={handleClearError}
      onUpload={handleUpload}
      progress={uploadProgress}
      uploadError={uploadError}
      variant={variant}
      label={label}
      subtitle={subtitle}
      className={className}
    />
  );
};
