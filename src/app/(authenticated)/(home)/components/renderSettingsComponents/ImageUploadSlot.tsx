import { DashedBorderOverlay } from "@components/DashedBorderOverlay";
import { Icon } from "@components/Icon";
import { ImageThumbnail } from "@components/ImageThumbnail";
import { Text } from "@components/Text";
import { useImageAsset } from "@domains/asset/useImageAsset";
import { UploadProgress } from "@home/components/fileUpload/UploadProgress";
import type { DropEvent } from "@react-types/shared";
import { cn } from "@utils";
import { ChangeEvent, useRef, useState, type MouseEvent } from "react";
import { DropZone } from "react-aria-components/DropZone";
import { useTranslation } from "react-i18next";

import { UploadError } from "../fileUpload/UploadError";

const SUPPORTED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png"];

export interface ImageUploadSlotProps {
  assetId?: string;
  onUpload: (e: ChangeEvent<HTMLInputElement>) => Promise<void>;
  onDelete: () => void;
  isDisabled?: boolean;
  uploadProgress?: number;
  uploadError?: string;
  onClearError: () => void;
  centerLabel?: string;
  bottomLabel?: string;
  showErrorText?: string;
  fileNameKeepStart?: number;
  fileNameKeepEnd?: number;
  fluidWidth?: boolean;
  allowMultiple?: boolean;
}

export const ImageUploadSlot: React.FC<ImageUploadSlotProps> = ({
  assetId,
  onUpload,
  onDelete,
  isDisabled = false,
  uploadProgress,
  uploadError,
  onClearError,
  centerLabel,
  bottomLabel,
  showErrorText,
  fileNameKeepStart,
  fileNameKeepEnd,
  fluidWidth = false,
  allowMultiple = false
}) => {
  const widthClass = fluidWidth ? "w-full min-w-0" : "w-[153px]";
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");

  const { data: imageAssetData } = useImageAsset({
    assetId,
    enabled: !!assetId
  });
  const handleDrop = async (e: DropEvent) => {
    if (isDisabled) return;

    const validItems = e.items.filter(
      (item) => item.kind === "text" || item.kind === "file"
    );
    for (const item of validItems) {
      if (item.kind === "file") {
        const file = await item.getFile();
        const isSupportedType = SUPPORTED_MIME_TYPES.some((type) =>
          file.type.startsWith(type)
        );
        if (file && isSupportedType) {
          setFileName(file.name);
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);

          const syntheticEvent = {
            target: {
              files: dataTransfer.files
            }
          } as ChangeEvent<HTMLInputElement>;

          await onUpload(syntheticEvent);
          return;
        }
      }
    }
  };
  const handleClick = (e: MouseEvent) => {
    if (isDisabled || !fileInputRef.current) return;

    e.preventDefault();
    e.stopPropagation();

    try {
      fileInputRef.current?.focus({
        preventScroll: true
      });
    } catch {}
    fileInputRef.current?.click();
  };
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFileName(file.name);
      await onUpload(e);
    }
  };
  const handleClearError = () => {
    setFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClearError();
  };

  if (assetId && imageAssetData?.urlToUse) {
    return (
      <div className={`flex flex-col gap-1 ${widthClass}`}>
        <ImageThumbnail
          src={imageAssetData.urlToUse}
          name={imageAssetData.asset?.name}
          onDelete={onDelete}
        />
        {showErrorText ? (
          <Text variant="2xs" color="error">
            {showErrorText}
          </Text>
        ) : (
          <Text variant="2xs" color="glyph-tertiary">
            {bottomLabel}
          </Text>
        )}
      </div>
    );
  }
  const isUploading = uploadProgress !== undefined && uploadProgress > 0;
  const displayError = uploadError || "";
  const isSlotWaitingForFile = !displayError && !isUploading && !isDisabled;

  return (
    <>
      <input
        accept="image/jpeg,image/jpg,image/png"
        className="hidden"
        disabled={isDisabled}
        multiple={allowMultiple}
        onChange={handleFileChange}
        ref={fileInputRef}
        type="file"
      />
      <DropZone
        className={cn(
          "group relative rounded h-[88px] data-[drop-target]:bg-element-success/10",
          isSlotWaitingForFile && "hover:bg-element-success/10",
          widthClass
        )}
        onDrop={handleDrop}
      >
        <DashedBorderOverlay cornerSize="xs" />
        <div
          className="flex flex-col items-center justify-center h-full w-full"
          onClick={displayError ? undefined : handleClick}
          style={{
            cursor: isDisabled ? "default" : "pointer"
          }}
        >
          {displayError ? (
            <UploadError
              fileName={fileName}
              onClearFileName={handleClearError}
              uploadError={displayError}
              fileNameKeepStart={fileNameKeepStart}
              fileNameKeepEnd={fileNameKeepEnd}
              compact
            />
          ) : isUploading ? (
            <UploadProgress
              fileName={fileName}
              progress={uploadProgress}
              fileNameKeepStart={fileNameKeepStart}
              fileNameKeepEnd={fileNameKeepEnd}
              compact
            />
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <Icon
                iconSet="24"
                iconName="upload"
                className="text-glyph-secondary"
              />
              <Text align="center" disabled={isDisabled} select="none">
                {centerLabel}
              </Text>
            </div>
          )}
        </div>
      </DropZone>
    </>
  );
};
