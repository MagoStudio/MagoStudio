import { GhostButton } from "@components/GhostButton";
import { useImageAsset } from "@domains/asset/useImageAsset";
import { useUploadReferenceImage } from "@domains/asset/useUploadReferenceImage";
import { useVideoFrame } from "@domains/asset/useVideoFrame";
import { useProject } from "@domains/project/useProject";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { useAdjustedFrameRange } from "@domains/renders/useAdjustedFrameRange";
import { useMaskRangeValidation } from "@domains/renders/useMaskRangeValidation";
import { parseSourceImageTypes } from "@domains/renders/utils/parseSourceImageTypes";
import { useSelectedShot } from "@domains/shot/useSelectedShot";
import { useFilteredAndSortedTracks } from "@domains/track/useFilteredAndSortedTracks";
import { getTrackAssetData } from "@domains/track/utils/getTrackAssetData";
import { getTrackAssetId } from "@domains/track/utils/getTrackAssetId";
import { validateImageFile } from "@home/components/fileUpload/helpers/validateImageFile";
import { downloadFile, handleDownloadVideo } from "@hooks/files/utils";
import { useTool } from "@hooks/tool/useTool";
import type { DropEvent } from "@react-types/shared";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { useSetAtom, useAtomValue } from "jotai";
import type { ChangeEvent } from "react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { RenderSettingComponentProps } from "../interface";

import { FrameMaskTile } from "./FrameMaskTile";

export const FrameAndMaskInput: React.FC<
  RenderSettingComponentProps<string | undefined>
> = ({ value, isDisabled, specificConfig }) => {
  const { t } = useTranslation();
  const { setTool } = useTool();
  const { renderSettingsValuesAtom, selectedModelAtom, sourcesAtom } =
    useRenderSettingsAtoms();
  const renderSettings = useAtomValue(renderSettingsValuesAtom);
  const selectedModel = useAtomValue(selectedModelAtom);
  const adjustedFrameRange = useAdjustedFrameRange();
  const sources = useAtomValue(sourcesAtom);
  const setSources = useSetAtom(sourcesAtom);

  const referenceRole =
    parseSourceImageTypes(specificConfig?.sourceRoles)[0] ?? "reference_frame";

  const addReferenceImage = (assetId: string) => {
    const withoutReference = sources.filter(
      (entry) => entry.type !== referenceRole
    );
    setSources([
      { asset_id: assetId, type: referenceRole },
      ...withoutReference
    ]);
  };
  const selectedProjectId = useSelectedProjectId();
  const { data: selectedProject } = useProject(selectedProjectId);
  const { data: selectedShot } = useSelectedShot();

  const { data: imageAssetData, isLoading: isImageAssetLoading } =
    useImageAsset({ assetId: value, enabled: !!value });

  const {
    mutateAsync: uploadReferenceImage,
    isPending: isUploading,
    uploadProgress
  } = useUploadReferenceImage();

  const [uploadError, setUploadError] = useState<string>("");
  const [uploadFileName, setUploadFileName] = useState<string>("");
  const [isDownloading, setIsDownloading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openFilePicker = () => {
    if (isDisabled) return;
    fileInputRef.current?.click();
  };

  const isLoadingImage = isUploading || (!!value && isImageAssetLoading);

  const maskTrackId =
    typeof renderSettings.input_mask === "string"
      ? renderSettings.input_mask
      : undefined;
  const { data } = useFilteredAndSortedTracks();
  const maskTrack = maskTrackId
    ? data.tracks.find((track) => track.id === maskTrackId)
    : undefined;
  const maskAssetId = getTrackAssetId(maskTrack);
  const { data: maskFrame, isLoading: isMaskLoading } = useVideoFrame({
    assetId: maskAssetId,
    enabled: !!maskAssetId,
    frameNumber: 0,
    fps: getTrackAssetData(maskTrack)?.fps
  });
  const hasMask = !!maskTrack;

  const maskRangeError = useMaskRangeValidation({
    selectedModelName: selectedModel.name,
    renderSettingsValues: renderSettings,
    rangeFrames: adjustedFrameRange
  });
  const maskErrorPillPrefix = maskRangeError
    ? t("inpainting.mask_range_error.pill_short.prefix")
    : undefined;
  const maskErrorPillRange = maskRangeError
    ? t("inpainting.mask_range_error.pill_short.range", {
        from: maskRangeError.maskFrames[0],
        to: maskRangeError.maskFrames[1]
      })
    : undefined;
  const maskErrorTooltipText = maskRangeError
    ? t(`inpainting.mask_range_error.${maskRangeError.kind}.description`)
    : undefined;

  const openEditFrameModal = () => setTool("edit-frame");
  const openMaskTab = () => setTool("mask");

  const handleFrameDrop = async (e: DropEvent) => {
    if (isDisabled || !selectedProjectId) return;
    setUploadError("");
    for (const item of e.items) {
      if (item.kind === "file") {
        try {
          const file = await item.getFile();
          setUploadFileName(file.name);
          const validationKey = await validateImageFile(file);
          if (validationKey) {
            setUploadError(t(validationKey));
            return;
          }
          const assetId = await uploadReferenceImage({
            file,
            projectId: selectedProjectId
          });
          if (assetId) {
            addReferenceImage(assetId);
          }
        } catch (error) {
          setUploadError((error as Error)?.message || "Upload failed");
        }
        break;
      }
    }
  };

  const handleUploadFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || isDisabled || !selectedProjectId) return;
    setUploadError("");
    setUploadFileName(file.name);
    const validationKey = await validateImageFile(file);
    if (validationKey) {
      setUploadError(t(validationKey));
      return;
    }
    try {
      const assetId = await uploadReferenceImage({
        file,
        projectId: selectedProjectId
      });
      if (assetId) {
        addReferenceImage(assetId);
      }
    } catch (error) {
      setUploadError((error as Error)?.message || "Upload failed");
    }
  };

  const handleClearUploadError = () => {
    setUploadError("");
    setUploadFileName("");
  };

  const handleDownloadFrame = () => {
    if (imageAssetData?.urlToUse && imageAssetData.asset?.name) {
      void downloadFile(imageAssetData.urlToUse, imageAssetData.asset.name);
    }
  };

  const handleDownloadMask = () => {
    if (!maskTrack) return;
    void handleDownloadVideo({
      projectName: selectedProject?.name || selectedShot?.name || "Untitled",
      track: maskTrack,
      trigger: "track_download_icon",
      setIsDownloading
    });
  };

  return (
    <div className="flex gap-2 w-full">
      <FrameMaskTile
        testId="edit-first-frame-thumbnail"
        placeholderLabel={t("inpainting.basic.edit_first_frame.label")}
        thumbnailUrl={imageAssetData?.urlToUse}
        caption={imageAssetData?.asset?.name}
        primaryButtons={
          <>
            <GhostButton
              isDisabled={isDisabled}
              onPress={openEditFrameModal}
              type="button"
            >
              {t("inpainting.basic.edit_first_frame.edit_button.label")}
            </GhostButton>
            <GhostButton
              isDisabled={isDisabled}
              loading={isUploading}
              onPress={openFilePicker}
              type="button"
            >
              {t("inpainting.basic.edit_first_frame.upload_button.label")}
            </GhostButton>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              className="hidden"
              disabled={isDisabled}
              onChange={handleUploadFile}
            />
          </>
        }
        canZoom={!!imageAssetData?.urlToUse}
        zoomName={imageAssetData?.asset?.name}
        onDownload={
          imageAssetData?.urlToUse && imageAssetData.asset?.name
            ? handleDownloadFrame
            : undefined
        }
        isLoading={isLoadingImage}
        isDisabled={isDisabled}
        uploadProgress={uploadProgress}
        uploadError={uploadError || undefined}
        onClearUploadError={handleClearUploadError}
        uploadFileName={uploadFileName}
        onDrop={handleFrameDrop}
      />

      <FrameMaskTile
        testId="mask-input-thumbnail"
        placeholderLabel={t("inpainting.basic.mask_input.label")}
        thumbnailUrl={maskFrame}
        caption={maskTrack?.name}
        primaryButtons={
          <GhostButton
            isDisabled={isDisabled}
            onPress={openMaskTab}
            type="button"
          >
            {t(
              hasMask
                ? "inpainting.basic.mask_input.change_mask_button.label"
                : "inpainting.basic.mask_input.create_mask_button.label"
            )}
          </GhostButton>
        }
        onTileClick={hasMask ? openMaskTab : undefined}
        canZoom={hasMask && !!maskFrame}
        zoomName={maskTrack?.name}
        onDownload={hasMask && !isDownloading ? handleDownloadMask : undefined}
        isLoading={isMaskLoading}
        isDisabled={isDisabled}
        hasError={!!maskRangeError}
        errorPillPrefix={maskErrorPillPrefix}
        errorPillRange={maskErrorPillRange}
        errorTooltipText={maskErrorTooltipText}
      />
    </div>
  );
};
