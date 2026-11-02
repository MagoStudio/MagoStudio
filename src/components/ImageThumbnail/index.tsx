import { buildDownloadFilename } from "@app/utils/files/buildDownloadFilename";
import { downloadFile } from "@hooks/files/utils";
import { cn } from "@utils";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import { AssetDownloadIndicator } from "../AssetDownloadIndicator";
import { CircularProgress } from "../CircularProgress";
import { Icon } from "../Icon";
import { IconActionButton } from "../IconActionButton";

import { useImageZoom } from "./hooks/useImageZoom";
import { ImagePreviewProps } from "./ImagePreview";

type Props = {
  assetId?: string;
  src?: string;
  srcThumbnail?: string;
  name?: string;
  alt?: string;
  isLoading?: boolean;
  isReadOnly?: boolean;
  imageObjectFit?: "contain" | "cover";
  onDelete?: () => void;
  onDownload?: () => void;
  classNames?: {
    root?: string;
    controlsContainer?: string;
  };
  children?: React.ReactNode | ((openZoom: () => void) => React.ReactNode);
  imagePreviewProps?: Partial<ImagePreviewProps>;
  width?: number;
  height?: number;
};

export const ImageThumbnail: React.FC<Props> = ({
  assetId,
  src,
  srcThumbnail,
  name,
  alt,
  isLoading,
  isReadOnly = false,
  imageObjectFit = "contain",
  onDelete,
  onDownload,
  classNames,
  children,
  imagePreviewProps
}) => {
  const thumbnailUrl = srcThumbnail || src;
  const { t } = useTranslation();
  const [loadedUrl, setLoadedUrl] = useState<string>();
  const [failedUrl, setFailedUrl] = useState<string>();
  const [attempt, setAttempt] = useState(0);
  const isImageLoading =
    !!thumbnailUrl && loadedUrl !== thumbnailUrl && failedUrl !== thumbnailUrl;
  const fullSizeUrl = src || srcThumbnail;

  const { open: handleOpenZoom, modal } = useImageZoom({
    src: fullSizeUrl,
    name,
    imagePreviewProps
  });

  const handleDownload = async () => {
    if (fullSizeUrl) {
      await downloadFile(fullSizeUrl, buildDownloadFilename(name));
    }
    onDownload?.();
  };

  const handleDelete = () => {
    onDelete?.();
  };

  return (
    <div
      className={cn(
        "group aspect-[154/84] relative flex flex-1 items-center justify-center bg-element-primary rounded border border-transparent hover:border-glyph-action-main overflow-hidden",
        classNames?.root
      )}
    >
      {typeof children === "function" ? children(handleOpenZoom) : children}
      {thumbnailUrl && failedUrl !== thumbnailUrl && (
        <img
          key={attempt}
          src={thumbnailUrl}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoadedUrl(thumbnailUrl)}
          onError={() => setFailedUrl(thumbnailUrl)}
          className={cn(
            "block w-full h-full rounded",
            imageObjectFit === "cover" ? "object-cover" : "object-contain"
          )}
        />
      )}
      {thumbnailUrl && failedUrl === thumbnailUrl && (
        <div
          role="status"
          className="absolute flex flex-col items-center text-sm"
        >
          <span>Image unavailable</span>
          <button
            type="button"
            className="underline"
            onClick={() => {
              setFailedUrl(undefined);
              setAttempt((value) => value + 1);
            }}
          >
            Retry
          </button>
        </div>
      )}
      {((!thumbnailUrl && isLoading) || isImageLoading) && (
        <CircularProgress
          className="absolute"
          color="glyph-tertiary"
          size="md"
          aria-label={t("status.loading_image.label")}
        />
      )}
      {!thumbnailUrl && !isLoading && (
        <Icon
          iconSet="24"
          iconName="broken-image"
          className="text-glyph-tertiary"
        />
      )}
      <AssetDownloadIndicator assetId={assetId} />
      {!isReadOnly && (
        <div
          className={cn(
            "absolute flex justify-between rounded bottom-1 left-1 right-1 opacity-0 group-hover:opacity-100",
            classNames?.controlsContainer
          )}
        >
          <div className="flex gap-1">
            <IconActionButton
              aria-label="delete"
              icon={<Icon iconSet="16" iconName="delete" />}
              variant="dark"
              className={onDelete ? "block" : "hidden"}
              onPress={handleDelete}
            />
            <IconActionButton
              aria-label="download"
              icon={<Icon iconSet="16" iconName="download" />}
              variant="dark"
              onPress={handleDownload}
            />
          </div>

          <IconActionButton
            aria-label="zoom in"
            icon={<Icon iconSet="16" iconName="zoom-in" />}
            variant="dark"
            onPress={handleOpenZoom}
          />
        </div>
      )}

      {modal}
    </div>
  );
};
