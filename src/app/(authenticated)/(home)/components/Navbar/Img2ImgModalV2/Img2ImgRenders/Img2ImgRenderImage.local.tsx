import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { ImageThumbnail } from "@components/ImageThumbnail";
import { useImageAsset } from "@domains/asset/useImageAsset";
import { usePutImageAsset } from "@domains/asset/usePutImageAsset";
import { SourceImageCrop } from "@domains/renders/utils/getImg2ImgClipCrop";
import { useInputTrackFrameSrc } from "@domains/track/useInputTrackFrameSrc";
import { Img2ImgRenderStatus } from "@models/img2img/types";
import { cn } from "@utils";
import React from "react";
import { useTranslation } from "react-i18next";
import { useIntersectionObserver } from "usehooks-ts";

import { useCroppedSourceImageSrc } from "../hooks/useCroppedSourceImageSrc";

const IN_PROGRESS_RENDER_STATUSES = [
  Img2ImgRenderStatus.CREATED,
  Img2ImgRenderStatus.NOT_STARTED,
  Img2ImgRenderStatus.QUEUED,
  Img2ImgRenderStatus.RUNNING,
  Img2ImgRenderStatus.STARTED,
  Img2ImgRenderStatus.UPLOADING
];

type Props = {
  assetId: string | undefined;
  clipStatus: string | undefined;
  filename: string;
  canNavigatePrev: boolean;
  canNavigateNext: boolean;
  onNavigatePrev: () => void;
  onNavigateNext: () => void;
  inputImageId?: string;
  inputImageUrl?: string;
  sourceFrame?: number;
  drawnMaskImageId?: string;
  imageCrop?: SourceImageCrop;
};

export const Img2ImgRenderImage: React.FC<Props> = ({
  assetId,
  clipStatus,
  filename,
  canNavigatePrev,
  canNavigateNext,
  onNavigatePrev,
  onNavigateNext,
  inputImageId,
  inputImageUrl,
  sourceFrame,
  drawnMaskImageId,
  imageCrop
}) => {
  const { t } = useTranslation();
  const { ref: visibilityRef, isIntersecting } = useIntersectionObserver({
    rootMargin: "100px"
  });

  const { data: assetImageResponse, isFetching: isOutputImageFetching } =
    useImageAsset({
      assetId,
      enabled: isIntersecting && clipStatus === Img2ImgRenderStatus.SUCCESS
    });

  const { data: sourceImageAsset } = useImageAsset({
    assetId: inputImageId,
    enabled:
      isIntersecting &&
      !!inputImageId &&
      clipStatus === Img2ImgRenderStatus.SUCCESS
  });

  const { inputTrackFrameSrc } = useInputTrackFrameSrc({
    frameNumber: sourceFrame ?? 0
  });

  const { data: maskLayerAsset } = useImageAsset({
    assetId: drawnMaskImageId,
    enabled:
      isIntersecting &&
      !!drawnMaskImageId &&
      clipStatus === Img2ImgRenderStatus.SUCCESS
  });
  const maskOverlaySrc = maskLayerAsset?.urlToUse;

  const getSourceImageSrc = (): string | undefined => {
    if (sourceImageAsset?.urlToUse) {
      return sourceImageAsset.urlToUse;
    }
    if (!inputImageId && sourceFrame !== undefined) {
      return inputTrackFrameSrc;
    }
    return inputImageUrl;
  };

  const baseSourceImageSrc = getSourceImageSrc();
  const sourcePreviewNeedsCrop = !!imageCrop && !sourceImageAsset?.urlToUse;
  const sourceImageSrc = useCroppedSourceImageSrc({
    sourceImageSrc: baseSourceImageSrc,
    imageCrop: sourcePreviewNeedsCrop ? imageCrop : undefined
  });

  const isFavorite =
    assetImageResponse?.asset?.rate && assetImageResponse?.asset?.rate > 0;
  const { mutate: putImageAsset } = usePutImageAsset({
    assetId: assetId ?? ""
  });

  const outputUrl = assetImageResponse?.urlToUse || "";

  const isClipRenderInProgress = IN_PROGRESS_RENDER_STATUSES.includes(
    clipStatus as Img2ImgRenderStatus
  );
  const isOutputImageStillLoading =
    isClipRenderInProgress || isOutputImageFetching;

  return (
    <div ref={visibilityRef} className="flex flex-1">
      <ImageThumbnail
        assetId={assetId}
        src={outputUrl}
        name={filename}
        isLoading={isOutputImageStillLoading}
        classNames={{
          root: "bg-surface-background",
          controlsContainer: "p-2 !hidden"
        }}
        imagePreviewProps={{
          canNavigatePrev,
          canNavigateNext,
          onNavigatePrev,
          onNavigateNext,
          isFavorite: !!isFavorite,
          onToggleFavorite: () => putImageAsset({ rate: isFavorite ? 0 : 2 }),
          sourceImageSrc,
          maskOverlaySrc
        }}
      >
        {(openZoom) => (
          <div
            onClick={openZoom}
            className="w-full h-full aspect-video absolute cursor-pointer"
          >
            <div
              className="absolute top-3 right-3 z-10 flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <IconActionButton
                aria-label={t("actions.set_as_favorite.label")}
                aria-pressed={Boolean(isFavorite)}
                className="backdrop-blur-[10px]"
                icon={
                  <Icon
                    iconSet="16-filled"
                    iconName="rating"
                    className={cn(
                      assetImageResponse?.asset?.rate
                        ? "text-element-in-progress"
                        : "text-glyph-tertiary"
                    )}
                  />
                }
                variant="onImage"
                onPress={() => putImageAsset({ rate: isFavorite ? 0 : 2 })}
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <IconActionButton
                aria-label="zoom in"
                icon={<Icon iconSet="16" iconName="zoom-in" />}
                variant="dark"
                onPress={openZoom}
              />
            </div>
          </div>
        )}
      </ImageThumbnail>
    </div>
  );
};
