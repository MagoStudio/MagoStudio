import { Badge } from "@components/Badge";
import { GhostButton } from "@components/GhostButton";
import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { useImageZoom } from "@components/ImageThumbnail/hooks/useImageZoom";
import { MediaTile } from "@components/MediaTile";
import { useImageAsset } from "@domains/asset/useImageAsset";
import { useUploadReferenceImage } from "@domains/asset/useUploadReferenceImage";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { findModifyFrameSourceFrame } from "@domains/renders/utils/findModifyFrameSourceFrame";
import { parseSourceImageTypes } from "@domains/renders/utils/parseSourceImageTypes";
import { useSelectedShot } from "@domains/shot/useSelectedShot";
import { useInputTrackFrameSrc } from "@domains/track/useInputTrackFrameSrc";
import { validateImageFile } from "@home/components/fileUpload/helpers/validateImageFile";
import { UploadError } from "@home/components/fileUpload/UploadError";
import { UploadProgress } from "@home/components/fileUpload/UploadProgress";
import { downloadFile } from "@hooks/files/utils";
import { useTool } from "@hooks/tool/useTool";
import type { DropEvent } from "@react-types/shared";
import { currentVideoFrameAtom } from "@store/atoms";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { useAtomValue, useSetAtom } from "jotai";
import type { ChangeEvent } from "react";
import { useRef, useState } from "react";
import { DropZone } from "react-aria-components/DropZone";
import { useTranslation } from "react-i18next";

import { RenderSettingComponentProps } from "./interface";

export const ModifyFrameInput: React.FC<
  RenderSettingComponentProps<string | undefined>
> = ({ value, isDisabled, specificConfig }) => {
  const { t } = useTranslation();
  const { setTool } = useTool();
  const { sourcesAtom } = useRenderSettingsAtoms();
  const sources = useAtomValue(sourcesAtom);
  const setSources = useSetAtom(sourcesAtom);
  const selectedProjectId = useSelectedProjectId();

  const referenceRole =
    parseSourceImageTypes(specificConfig?.sourceRoles)[0] ?? "reference_frame";

  const { data: selectedShot } = useSelectedShot();
  const modifyFrameSourceFrame = findModifyFrameSourceFrame(
    selectedShot?.layers,
    value
  );

  const addReferenceImage = (assetId: string) => {
    const withoutReference = sources.filter(
      (entry) => entry.type !== referenceRole
    );
    setSources([
      { asset_id: assetId, type: referenceRole },
      ...withoutReference
    ]);
  };

  const removeReferenceImage = () => {
    setSources(sources.filter((entry) => entry.type !== referenceRole));
  };

  const { data: imageAssetData, isLoading: isImageAssetLoading } =
    useImageAsset({ assetId: value, enabled: !!value });

  const hasModifiedFrame = !!value;
  const playheadFrame = useAtomValue(currentVideoFrameAtom);
  const {
    inputTrackFrameSrc: playheadPreviewSrc,
    isLoading: isPlayheadPreviewLoading
  } = useInputTrackFrameSrc({
    frameNumber: playheadFrame,
    enabled: !hasModifiedFrame
  });

  const {
    mutateAsync: uploadReferenceImage,
    isPending: isUploading,
    uploadProgress
  } = useUploadReferenceImage();

  const [uploadError, setUploadError] = useState<string>("");
  const [uploadFileName, setUploadFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openFilePicker = () => {
    if (isDisabled) return;
    fileInputRef.current?.click();
  };

  const isLoadingImage = isUploading || (!!value && isImageAssetLoading);

  const uploadFile = async (file: File) => {
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
      if (!assetId) {
        setUploadError(t("inpainting.modify_frame.upload_failed.description"));
        return;
      }
      addReferenceImage(assetId);
    } catch {
      setUploadError(t("inpainting.modify_frame.upload_failed.description"));
    }
  };

  const handleUploadFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || isDisabled || !selectedProjectId) return;
    await uploadFile(file);
  };

  const handleFrameDrop = async (e: DropEvent) => {
    if (isDisabled || !selectedProjectId) return;
    for (const item of e.items) {
      if (item.kind === "file") {
        const file = await item.getFile();
        await uploadFile(file);
        break;
      }
    }
  };

  const handleClearUploadError = () => {
    setUploadError("");
    setUploadFileName("");
  };

  const handleDownload = () => {
    if (imageAssetData?.urlToUse && imageAssetData.asset?.name) {
      void downloadFile(imageAssetData.urlToUse, imageAssetData.asset.name);
    }
  };

  const openEditFrameModal = () => setTool("edit-frame");

  const isUploadingProgress = uploadProgress > 0;
  const hasUploadError = !!uploadError;
  const isOverlayActive = isUploadingProgress || hasUploadError;
  const hasFrame = hasModifiedFrame;
  const thumbnailSrc = hasModifiedFrame
    ? imageAssetData?.urlToUse
    : playheadPreviewSrc;

  const { open: openZoom, modal: zoomModal } = useImageZoom({
    src: thumbnailSrc,
    name: imageAssetData?.asset?.name
  });
  const canZoom = !!thumbnailSrc && !isOverlayActive && !isDisabled;

  const overlay = isUploadingProgress ? (
    <UploadProgress
      fileName={uploadFileName}
      progress={uploadProgress}
      fileNameKeepStart={10}
      fileNameKeepEnd={2}
    />
  ) : hasUploadError ? (
    <UploadError
      fileName={uploadFileName}
      uploadError={uploadError}
      onClearFileName={handleClearUploadError}
      fileNameKeepStart={10}
      fileNameKeepEnd={2}
    />
  ) : undefined;

  return (
    <DropZone
      onDrop={handleFrameDrop}
      isDisabled={isDisabled}
      className="block w-full rounded"
    >
      <MediaTile
        testId="modify-frame-tile"
        thumbnailUrl={isOverlayActive ? undefined : thumbnailSrc}
        isLoading={
          !isOverlayActive &&
          (isLoadingImage || (!hasModifiedFrame && isPlayheadPreviewLoading))
        }
        tilePresentation="asset"
        overlay={overlay}
        hoverActions={
          canZoom ? (
            <IconActionButton
              aria-label={t("actions.zoom_in.label")}
              icon={<Icon iconSet="16" iconName="zoom-in" />}
              variant="dark"
              onPress={openZoom}
            />
          ) : undefined
        }
        labelPill={
          hasFrame && modifyFrameSourceFrame !== undefined ? (
            <Badge>
              {t("inpainting.modify_frame.frame_pill.label", {
                frame: modifyFrameSourceFrame
              })}
            </Badge>
          ) : undefined
        }
        actions={
          hasFrame && !isDisabled ? (
            <>
              {imageAssetData?.urlToUse && imageAssetData.asset?.name && (
                <IconActionButton
                  aria-label={t("actions.download.label")}
                  icon={<Icon iconSet="16" iconName="download" />}
                  variant="dark"
                  onPress={handleDownload}
                />
              )}
              <IconActionButton
                aria-label={t("actions.delete.label")}
                icon={<Icon iconSet="16" iconName="delete" />}
                variant="dark"
                onPress={removeReferenceImage}
              />
            </>
          ) : undefined
        }
        footer={
          hasFrame ? undefined : (
            <div className="flex items-center gap-1 p-2">
              <GhostButton
                className="flex-1"
                colorScheme="white"
                isDisabled={isDisabled}
                onPress={openEditFrameModal}
                type="button"
              >
                {t("inpainting.modify_frame.edit_key_frame.label", {
                  frame: modifyFrameSourceFrame ?? playheadFrame
                })}
              </GhostButton>
              <IconActionButton
                aria-label={t(
                  "inpainting.basic.edit_first_frame.upload_button.label"
                )}
                icon={<Icon iconSet="16" iconName="upload" />}
                variant="dark"
                isDisabled={isDisabled}
                onPress={openFilePicker}
              />
            </div>
          )
        }
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        className="hidden"
        disabled={isDisabled}
        onChange={handleUploadFile}
      />
      {zoomModal}
    </DropZone>
  );
};
