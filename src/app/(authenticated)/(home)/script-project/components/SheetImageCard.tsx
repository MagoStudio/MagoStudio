import { AnimatedGradient } from "@components/AnimatedGradient";
import { ImageThumbnail } from "@components/ImageThumbnail";
import { Text } from "@components/Text";
import { useCachedImageUrl } from "@domains/asset/useCachedImageUrl";
import { toDesktopCloudStorageUrl } from "@domains/asset/utils/toDesktopCloudStorageUrl";
import { SheetImageUrls } from "@domains/scriptProject/utils/buildSheetImageUrlIndex";
import { isSheetImageSuccessful } from "@domains/scriptProject/utils/findNewestSuccessfulSheetImage";
import { isSheetImageRendering } from "@domains/scriptProject/utils/isSheetImageRendering";
import { SheetImage } from "@schemas/scriptProject";
import { cn } from "@utils";
import { useTranslation } from "react-i18next";
import { useIntersectionObserver } from "usehooks-ts";

import { RenderMetricsBadge } from "./RenderMetricsBadge";
import { SheetImageRenderError } from "./SheetImageRenderError";

type Props = {
  image: SheetImage;
  imageUrls: SheetImageUrls | undefined;
  isPinned: boolean;
  isEffective: boolean;
  versionInputsButton: React.ReactNode;
  onPin: () => void;
};

export const SheetImageCard: React.FC<Props> = ({
  image,
  imageUrls,
  isPinned,
  isEffective,
  versionInputsButton,
  onPin
}) => {
  const { t } = useTranslation();
  const hasRenderSucceeded = isSheetImageSuccessful(image);
  const isRenderInProgress = isSheetImageRendering(image);
  const { ref: visibilityRef, isIntersecting } = useIntersectionObserver({
    rootMargin: "160px"
  });
  const hasRenderFailed = !hasRenderSucceeded && !isRenderInProgress;
  const versionName = image.name ?? image.asset_id;
  const displayedImageUrl = imageUrls?.thumbnailUrl ?? imageUrls?.url;
  const cachedDisplayedImageUrl = useCachedImageUrl(
    displayedImageUrl,
    imageUrls?.thumbnailUrl ? `${image.asset_id}_thumb` : image.asset_id,
    isIntersecting
  );

  return (
    <div
      ref={visibilityRef}
      data-testid={`sheet-image-${image.asset_id}`}
      className="flex w-full min-w-0 flex-col gap-1.5 rounded-xl bg-surface-primary p-1.5"
    >
      <div className="relative">
        <ImageThumbnail
          assetId={image.asset_id}
          src={
            isIntersecting && imageUrls?.url
              ? toDesktopCloudStorageUrl(imageUrls.url)
              : undefined
          }
          srcThumbnail={
            isIntersecting
              ? (cachedDisplayedImageUrl ??
                (displayedImageUrl &&
                  toDesktopCloudStorageUrl(displayedImageUrl)))
              : undefined
          }
          name={versionName}
          alt={versionName}
          isLoading={isRenderInProgress}
          classNames={{
            root: "aspect-square rounded-lg bg-transparent hover:border-transparent"
          }}
        />
        {isRenderInProgress && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg bg-surface-primary">
            <AnimatedGradient />
          </div>
        )}
        {hasRenderFailed && (
          <div className="absolute inset-0 flex items-center justify-center">
            <SheetImageRenderError clipId={image.clip_id} />
          </div>
        )}
        {image.source === "render" && (
          <RenderMetricsBadge
            assetId={image.asset_id}
            kind="image"
            hasRenderFinished={hasRenderSucceeded}
          />
        )}
        {image.source === "upload" && (
          <Text
            variant="2xs"
            color="glyph-primary-on-pic"
            className="pointer-events-none absolute left-1 top-1 rounded bg-element-on-image px-1 backdrop-blur-xl"
          >
            {t("script_project.uploaded_badge.label")}
          </Text>
        )}
        {isPinned && (
          <Text
            variant="2xs"
            color="glyph-primary-on-pic"
            className="pointer-events-none absolute right-1 top-1 rounded bg-element-additional-active px-1"
          >
            {t("script_project.pinned_badge.label")}
          </Text>
        )}
        {!isPinned && isEffective && (
          <Text
            variant="2xs"
            color="glyph-primary-on-pic"
            className="pointer-events-none absolute right-1 top-1 rounded bg-element-on-image px-1 backdrop-blur-xl"
          >
            {t("script_project.effective_badge.label")}
          </Text>
        )}
      </div>
      <div className="flex min-w-0 items-center justify-between gap-1 px-1 pb-0.5">
        <div className="flex min-w-0 items-center gap-1">
          <Text variant="2xs" color="glyph-tertiary" className="truncate">
            {versionName}
          </Text>
          {versionInputsButton}
        </div>
        {isRenderInProgress && (
          <Text variant="2xs" color="glyph-tertiary">
            {t("script_project.version_not_ready.label")}
          </Text>
        )}
      </div>
      {!isPinned && (
        <button
          type="button"
          disabled={!hasRenderSucceeded}
          onClick={onPin}
          data-testid={`sheet-image-pin-${image.asset_id}`}
          className={cn(
            "rounded bg-element-primary px-1.5 py-0.5 text-2xs font-lato text-glyph-secondary transition-colors hover:bg-element-primary-active hover:text-glyph-primary",
            !hasRenderSucceeded && "cursor-default opacity-50"
          )}
        >
          {t("script_project.pin_button.label")}
        </button>
      )}
    </div>
  );
};
