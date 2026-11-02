import { CircularProgress } from "@components/CircularProgress";
import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { useImageZoom } from "@components/ImageThumbnail/hooks/useImageZoom";
import { Text } from "@components/Text";
import { Tooltip } from "@components/Tooltip";
import { UploadError } from "@home/components/fileUpload/UploadError";
import { UploadProgress } from "@home/components/fileUpload/UploadProgress";
import type { DropEvent } from "@react-types/shared";
import { cn } from "@utils";
import React from "react";
import { Pressable } from "react-aria";
import { DropZone } from "react-aria-components/DropZone";
import { useTranslation } from "react-i18next";

type Props = {
  thumbnailUrl?: string;
  caption?: string;
  placeholderLabel: string;
  primaryButtons?: React.ReactNode;
  canZoom?: boolean;
  onDownload?: () => void;
  onTileClick?: () => void;
  isLoading?: boolean;
  isDisabled?: boolean;
  uploadProgress?: number;
  uploadError?: string;
  onClearUploadError?: () => void;
  uploadFileName?: string;
  onDrop?: (e: DropEvent) => void;
  zoomName?: string;
  testId?: string;
  hasError?: boolean;
  errorPillPrefix?: string;
  errorPillRange?: string;
  errorTooltipText?: string;
};

export const FrameMaskTile: React.FC<Props> = ({
  thumbnailUrl,
  caption,
  placeholderLabel,
  primaryButtons,
  canZoom,
  onDownload,
  onTileClick,
  isLoading,
  isDisabled,
  uploadProgress,
  uploadError,
  onClearUploadError,
  uploadFileName = "",
  onDrop,
  zoomName,
  testId,
  hasError,
  errorPillPrefix,
  errorPillRange,
  errorTooltipText
}) => {
  const { t } = useTranslation();

  const { open: openZoom, modal: zoomModal } = useImageZoom({
    src: thumbnailUrl,
    name: zoomName ?? caption
  });

  const isUploadingProgress =
    uploadProgress !== undefined && uploadProgress > 0;
  const hasUploadError = !!uploadError;
  const isOverlayActive = isUploadingProgress || hasUploadError;
  const showErrorVisuals = !!hasError && !isOverlayActive;
  const showHoverBorder = !isDisabled && !isOverlayActive && !showErrorVisuals;
  const isTilePressable = !!onTileClick && !isOverlayActive && !isDisabled;

  const tileClassName = cn(
    "group relative w-full h-24 rounded border border-transparent bg-surface-on-image overflow-hidden flex items-center justify-center transition-colors",
    showHoverBorder && "hover:border-glyph-action-main",
    showErrorVisuals && "border-element-error",
    isTilePressable &&
      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-glyph-action-main focus-visible:ring-offset-1",
    onDrop &&
      "group-data-[drop-target]/drop:border-dashed group-data-[drop-target]/drop:border-glyph-success group-data-[drop-target]/drop:bg-glyph-success-opacity-10"
  );

  const tileBody = (
    <>
      {!isOverlayActive && thumbnailUrl && (
        <img
          src={thumbnailUrl}
          alt={caption || placeholderLabel}
          loading="lazy"
          className="block w-full h-full object-contain"
        />
      )}

      {!isOverlayActive && !thumbnailUrl && !isLoading && (
        <Text variant="2xs" color="glyph-disabled" select="none">
          {placeholderLabel}
        </Text>
      )}

      {!isOverlayActive && !thumbnailUrl && isLoading && (
        <CircularProgress color="glyph-tertiary" size="md" />
      )}

      {isUploadingProgress && (
        <div className="absolute inset-0 flex items-center justify-center px-2">
          <UploadProgress
            fileName={uploadFileName}
            progress={uploadProgress!}
            fileNameKeepStart={10}
            fileNameKeepEnd={2}
          />
        </div>
      )}

      {hasUploadError && (
        <div className="absolute inset-0 flex items-center justify-center px-2">
          <UploadError
            fileName={uploadFileName}
            uploadError={uploadError}
            onClearFileName={() => onClearUploadError?.()}
            fileNameKeepStart={10}
            fileNameKeepEnd={2}
          />
        </div>
      )}

      {!isOverlayActive && primaryButtons && (
        <div className="absolute bottom-1 left-1 flex gap-1 pointer-events-auto">
          {primaryButtons}
        </div>
      )}

      {!isOverlayActive && !isDisabled && (onDownload || canZoom) && (
        <div className="absolute bottom-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onDownload && (
            <IconActionButton
              aria-label={t("actions.download.label")}
              icon={<Icon iconSet="16" iconName="download" />}
              variant="dark"
              onPress={onDownload}
            />
          )}
          {canZoom && (
            <IconActionButton
              aria-label={t("actions.zoom_in.label")}
              icon={<Icon iconSet="16" iconName="zoom-in" />}
              variant="dark"
              onPress={openZoom}
            />
          )}
        </div>
      )}

      {showErrorVisuals && errorPillPrefix && errorPillRange && (
        <div
          className="absolute top-1 right-1 flex items-center gap-1 rounded px-1.5 py-0.5 bg-element-on-image text-[10px] leading-4 font-medium whitespace-nowrap"
          data-testid={testId ? `${testId}-error-pill` : undefined}
        >
          <span className="text-glyph-error">{errorPillPrefix}</span>
          {errorTooltipText ? (
            <Tooltip
              placement="top"
              textContent={errorTooltipText}
              className="bg-element-error text-glyph-primary-on-pic shadow-none"
              arrowClassName="fill-element-error"
              trigger={
                <span
                  className="flex items-center text-glyph-error"
                  data-testid={
                    testId ? `${testId}-error-tooltip-trigger` : undefined
                  }
                >
                  <Icon
                    iconSet="16-filled"
                    iconName="info"
                    className="h-3 w-3"
                  />
                </span>
              }
            />
          ) : (
            <Icon
              iconSet="16-filled"
              iconName="info"
              className="h-3 w-3 text-glyph-error"
            />
          )}
          <span className="text-glyph-error">{errorPillRange}</span>
        </div>
      )}
    </>
  );

  const tileInner = isTilePressable ? (
    <Pressable onPress={onTileClick}>
      <div
        data-testid={testId}
        role="button"
        tabIndex={0}
        className={tileClassName}
      >
        {tileBody}
      </div>
    </Pressable>
  ) : (
    <div data-testid={testId} className={tileClassName}>
      {tileBody}
    </div>
  );

  return (
    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
      {onDrop ? (
        <DropZone
          onDrop={onDrop}
          isDisabled={isDisabled}
          className="group/drop block w-full rounded"
        >
          {tileInner}
        </DropZone>
      ) : (
        tileInner
      )}

      {caption && !isOverlayActive && (
        <Text
          variant="2xs"
          color="glyph-tertiary"
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
          className="w-0 min-w-full"
          select="none"
        >
          {caption}
        </Text>
      )}

      {zoomModal}
    </div>
  );
};
