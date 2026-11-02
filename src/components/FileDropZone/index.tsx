import { useUploadReferenceImage } from "@domains/asset/useUploadReferenceImage";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { FileName } from "@home/components/fileUpload/FileName";
import { cn, getImageDimensions } from "@utils";
import {
  getImageLimitErrorKey,
  IMAGE_UPLOAD_LIMITS
} from "@utils/image/imageUploadLimits";
import React, { forwardRef, useCallback, useState } from "react";
import { Button } from "react-aria-components/Button";
import { DropZone } from "react-aria-components/DropZone";
import { FileTrigger } from "react-aria-components/FileTrigger";
import { FileDropItem } from "react-aria-components/GridList";
import { useTranslation } from "react-i18next";

import { DashedBorderOverlay } from "../DashedBorderOverlay";
import { Icon } from "../Icon";
import { IconActionButton } from "../IconActionButton";
import { Text } from "../Text";
import { Tooltip } from "../Tooltip";

import {
  DEFAULT_ACCEPTED_IMAGE_FILE_TYPES,
  filterFilesByAcceptedType
} from "./filterFilesByAcceptedType";
import {
  FileDropZoneSize,
  getFileDropZoneLayout
} from "./getFileDropZoneLayout";
import { ImagesDisplay } from "./ImagesDisplay";

type BaseProps = {
  text?: string;
  hintText?: string;
  acceptedFileTypes?: string[];
};

export type FileDropZoneProps = BaseProps & {
  onChange?: (assetIds: string[]) => void;
  onFilesSelected?: (files: File[]) => void;
  value?: string[];
  maxFileUpload?: number;
  size?: FileDropZoneSize;
  className?: string;
};

const ERROR_AND_PROGRESS_LABEL_TYPOGRAPHY = "text-[11px] leading-4";

const PROGRESS_BAR_TRACK_WIDTH_PX = 80;
const PROGRESS_BAR_TRACK_INSET_PX = 4;
const PROGRESS_BAR_MAX_FILL_WIDTH_PX =
  PROGRESS_BAR_TRACK_WIDTH_PX - PROGRESS_BAR_TRACK_INSET_PX * 2;
const PERCENT_MAXIMUM = 100;

export const FileDropZone = forwardRef<HTMLDivElement, FileDropZoneProps>(
  (
    {
      text,
      hintText,
      onChange,
      onFilesSelected,
      value = [],
      maxFileUpload = 1,
      size = "medium",
      acceptedFileTypes = DEFAULT_ACCEPTED_IMAGE_FILE_TYPES,
      className
    },
    ref
  ) => {
    const { t } = useTranslation();

    const defaultText = text ?? t("notifications.upload_files.label");
    const defaultHintText =
      hintText ?? t("notifications.upload_files.description");

    const {
      mutateAsync: uploadReferenceImage,
      uploadProgress: referenceImageUploadProgress
    } = useUploadReferenceImage();
    const selectedProjectId = useSelectedProjectId();
    const [uploadErrorKey, setUploadErrorKey] = useState<string>("");
    const [errorFileName, setErrorFileName] = useState<string>("");
    const [isUploadingFilesInThisDropZone, setIsUploadingFilesInThisDropZone] =
      useState(false);
    const [uploadingFileName, setUploadingFileName] = useState<string>("");

    const validateFile = useCallback(async (file: File) => {
      const { width, height } = await getImageDimensions(file);
      return getImageLimitErrorKey(
        file,
        { width, height },
        IMAGE_UPLOAD_LIMITS
      );
    }, []);

    const clearUploadError = () => {
      setUploadErrorKey("");
      setErrorFileName("");
    };

    const dismissUploadingIndicator = () => {
      setIsUploadingFilesInThisDropZone(false);
    };

    const setFileItems = useCallback(
      async (droppedFiles: File[]) => {
        const { acceptedFiles: files, firstRejectedFile } =
          filterFilesByAcceptedType(droppedFiles, acceptedFileTypes);

        setUploadErrorKey(
          firstRejectedFile
            ? "upload_button_notification_image_file_format"
            : ""
        );
        setErrorFileName(firstRejectedFile ? firstRejectedFile.name : "");

        if (files.length === 0) return;

        if (onFilesSelected) {
          onFilesSelected(files);
          return;
        }

        setIsUploadingFilesInThisDropZone(true);

        try {
          const uploadedAssetIds: Array<string | undefined> = [];
          for (const file of files) {
            let limitErrorKey: string | null = null;
            try {
              limitErrorKey = await validateFile(file);
            } catch (error) {
              console.error("Failed to read image dimensions:", error);
              setUploadErrorKey("upload_button_file_read_error");
              setErrorFileName(file.name);
              return;
            }
            if (limitErrorKey) {
              setUploadErrorKey(limitErrorKey);
              setErrorFileName(file.name);
              return;
            }

            try {
              setUploadingFileName(file.name);
              const assetId = await uploadReferenceImage({
                file,
                projectId: selectedProjectId
              });
              uploadedAssetIds.push(assetId);
            } catch {
              return;
            }
          }

          const filteredAssetIds = uploadedAssetIds.filter(
            (assetId): assetId is string => assetId !== undefined
          );

          if (!onChange) return;

          onChange?.([...value, ...filteredAssetIds]);
        } finally {
          setIsUploadingFilesInThisDropZone(false);
        }
      },
      [
        acceptedFileTypes,
        onChange,
        onFilesSelected,
        uploadReferenceImage,
        selectedProjectId,
        validateFile,
        value
      ]
    );

    const onDeleteImage = (assetIdToDelete: string) => {
      if (!onChange) return;

      const valueArray = Array.isArray(value) ? value : [value];
      const newAssetIds = valueArray.filter(
        (assetId) => assetId !== assetIdToDelete
      );

      onChange?.(newAssetIds);
    };

    const valueArray = Array.isArray(value) ? value : value ? [value] : [];
    const shouldShowDropZone = valueArray.length < maxFileUpload;
    const shouldShowImagesDisplay = valueArray.length > 0;
    const isSmallSize = size === "small";
    const usesIconOnlyPresentation = isSmallSize || shouldShowImagesDisplay;

    const progressBarFillWidthPx = Math.min(
      PROGRESS_BAR_MAX_FILL_WIDTH_PX,
      Math.max(
        0,
        (referenceImageUploadProgress / PERCENT_MAXIMUM) *
          PROGRESS_BAR_MAX_FILL_WIDTH_PX
      )
    );

    const errorReasonTooltipIcon = (
      <Tooltip
        textContent={t(`notifications.${uploadErrorKey}.description`)}
        trigger={
          <Icon
            iconSet="16-filled"
            iconName="info"
            className="text-glyph-error"
          />
        }
      />
    );

    const dismissButton = (onPress: () => void) => (
      <IconActionButton
        variant="transparent"
        size="sm"
        icon={<Icon iconSet="16" iconName="cross" />}
        aria-label={t("actions.close.label")}
        onPress={onPress}
      />
    );

    return (
      <div
        ref={ref}
        className={cn(
          getFileDropZoneLayout({
            count: valueArray.length,
            maxFileUpload,
            size
          }),
          className
        )}
      >
        {shouldShowImagesDisplay && (
          <ImagesDisplay
            assetIds={valueArray}
            onDeleteImage={onDeleteImage}
            size={size}
          />
        )}
        {shouldShowDropZone && (
          <DropZone
            className={cn(
              "group relative overflow-hidden rounded",
              "hover:bg-element-success/10 data-[drop-target]:bg-element-success/10",
              !isSmallSize && shouldShowImagesDisplay && "aspect-[154/84]"
            )}
            getDropOperation={(types) => {
              for (const acceptedType of acceptedFileTypes) {
                if (types.has(acceptedType)) {
                  return "copy";
                }
              }
              return "cancel";
            }}
            onDrop={async (e) => {
              const fileItems = e.items.filter(
                (file) => file.kind === "file"
              ) as FileDropItem[];
              const fileObjects = await Promise.all(
                fileItems.map((item) => item.getFile())
              );
              void setFileItems(fileObjects);
            }}
          >
            <DashedBorderOverlay />
            {uploadErrorKey ? (
              usesIconOnlyPresentation ? (
                <div
                  className="flex gap-1 justify-center items-center w-full h-full p-6 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1 h-6 rounded px-1.5 py-0.5 bg-element-on-image backdrop-blur-[10px]">
                    <Text color="glyph-error" variant="sm">
                      {t("status.error.label")}
                    </Text>
                    {errorReasonTooltipIcon}
                  </div>
                  {dismissButton(clearUploadError)}
                </div>
              ) : (
                <div
                  className="relative flex flex-col items-center justify-center gap-1 w-full h-full p-6 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1 h-6 px-1 py-0.5 rounded backdrop-blur-[10px]">
                    <Text
                      color="glyph-error"
                      className={ERROR_AND_PROGRESS_LABEL_TYPOGRAPHY}
                    >
                      {t("status.error.label")}
                    </Text>
                    {errorReasonTooltipIcon}
                  </div>
                  <div className="flex items-center gap-1 max-w-full">
                    <FileName
                      fileName={errorFileName}
                      keepStart={20}
                      keepEnd={5}
                      color="glyph-secondary"
                      variant="sm"
                    />
                    {dismissButton(clearUploadError)}
                  </div>
                </div>
              )
            ) : isUploadingFilesInThisDropZone ? (
              usesIconOnlyPresentation ? (
                <div className="flex justify-center items-center w-full h-full p-6">
                  <div className="flex items-center gap-1 h-6 rounded px-1.5 py-0.5 bg-element-on-image backdrop-blur-[10px]">
                    <span
                      aria-hidden
                      className="relative h-4 w-4 shrink-0 rounded-full [background-color:currentColor] text-glyph-warning animate-status-color-change after:content-[''] after:absolute after:top-0 after:left-0 after:h-4 after:w-4 after:rounded-full after:[background-color:currentColor] after:opacity-75 after:blur-sm after:animate-status-pulse"
                    />
                    <Text color="glyph-warning" variant="sm">
                      {referenceImageUploadProgress}%
                    </Text>
                  </div>
                </div>
              ) : (
                <div className="relative flex flex-col items-center justify-center gap-1 w-full h-full p-6">
                  <div className="flex items-center gap-1 h-6">
                    <div className="flex items-center justify-center h-6 w-7 shrink-0 rounded backdrop-blur-[10px]">
                      <Text
                        color="glyph-warning"
                        className={ERROR_AND_PROGRESS_LABEL_TYPOGRAPHY}
                      >
                        {referenceImageUploadProgress}%
                      </Text>
                    </div>
                    <div className="relative h-3 w-20 shrink-0 overflow-hidden rounded-full bg-element-tertiary">
                      <div
                        className="absolute top-1/2 left-1 h-1 -translate-y-1/2 rounded-full bg-glyph-warning drop-shadow-[0_0_14px_1px_rgba(255,237,144,0.6)]"
                        style={{ width: `${progressBarFillWidthPx}px` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 max-w-full">
                    <FileName
                      fileName={uploadingFileName}
                      keepStart={20}
                      keepEnd={5}
                      color="glyph-secondary"
                      variant="sm"
                    />
                    {dismissButton(dismissUploadingIndicator)}
                  </div>
                </div>
              )
            ) : (
              <FileTrigger
                acceptedFileTypes={acceptedFileTypes}
                allowsMultiple={maxFileUpload > 1}
                onSelect={(e) => {
                  if (!e) return;
                  void setFileItems(Array.from(e));
                }}
              >
                <Button
                  className={cn(
                    "flex flex-col items-center justify-center w-full text-glyph-secondary",
                    usesIconOnlyPresentation ? "h-full p-4" : "gap-1 p-6"
                  )}
                >
                  <Icon
                    iconSet="24"
                    iconName="upload"
                    className="text-glyph-secondary"
                  />
                  {!usesIconOnlyPresentation && (
                    <div className="flex flex-col items-center gap-0">
                      <Text
                        color="glyph-primary"
                        variant="md"
                        className="leading-5"
                      >
                        {defaultText}
                      </Text>
                      {defaultHintText && (
                        <Text color="glyph-tertiary" variant="sm">
                          {defaultHintText}
                        </Text>
                      )}
                    </div>
                  )}
                </Button>
              </FileTrigger>
            )}
          </DropZone>
        )}
      </div>
    );
  }
);

FileDropZone.displayName = "FileDropZone";
