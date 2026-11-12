import { AnimatedGradient } from "@components/AnimatedGradient";
import { useImageZoom } from "@components/ImageThumbnail/hooks/useImageZoom";
import { Text } from "@components/Text";
import { useCachedOrProxiedImageUrl } from "@domains/asset/useCachedOrProxiedImageUrl";
import { STORYBOARD_IMAGE_SIZE } from "@domains/scriptProject/constants";
import { cn } from "@utils";
import { useTranslation } from "react-i18next";

import { SheetImageRenderError } from "./SheetImageRenderError";

type Props = {
  storyboardImageUrl: string | undefined;
  storyboardImageAssetId: string | undefined;
  isStoryboardRendering: boolean;
  failedStoryboardClipId: string | undefined;
  hasStoryboardFailed: boolean;
  testId: string;
  versionInputsButton?: React.ReactNode;
};

export const ShotStoryboardVersionCard: React.FC<Props> = ({
  storyboardImageUrl,
  storyboardImageAssetId,
  isStoryboardRendering,
  failedStoryboardClipId,
  hasStoryboardFailed,
  testId,
  versionInputsButton
}) => {
  const { t } = useTranslation();
  const readableStoryboardImageUrl = useCachedOrProxiedImageUrl(
    storyboardImageUrl,
    storyboardImageAssetId
  );
  const isStoryboardZoomable =
    !isStoryboardRendering && !!readableStoryboardImageUrl;
  const { open: openStoryboardZoom, modal: storyboardZoomModal } = useImageZoom(
    { src: readableStoryboardImageUrl }
  );

  return (
    <div className="flex w-full shrink-0 flex-col gap-1" data-testid={testId}>
      {versionInputsButton && (
        <div className="flex items-center gap-1">
          <Text variant="2xs" color="glyph-tertiary">
            {t("script_project.shot_version_current.label")}
          </Text>
          {versionInputsButton}
        </div>
      )}
      <div
        style={{
          aspectRatio: `${STORYBOARD_IMAGE_SIZE.width} / ${STORYBOARD_IMAGE_SIZE.height}`
        }}
        className={cn(
          "relative flex w-full items-center justify-center overflow-hidden rounded-lg bg-surface-primary",
          isStoryboardZoomable && "cursor-zoom-in"
        )}
        onClick={isStoryboardZoomable ? openStoryboardZoom : undefined}
        role="presentation"
      >
        {isStoryboardRendering ? (
          <AnimatedGradient />
        ) : readableStoryboardImageUrl ? (
          <img
            alt=""
            src={readableStoryboardImageUrl}
            className="h-full w-full object-contain"
            data-testid={`${testId}-image`}
          />
        ) : failedStoryboardClipId ? (
          <div data-testid={`${testId}-failed`}>
            <SheetImageRenderError clipId={failedStoryboardClipId} />
          </div>
        ) : hasStoryboardFailed ? (
          <Text
            variant="2xs"
            color="glyph-error"
            data-testid={`${testId}-failed`}
          >
            {t("script_project.shot_storyboard_failed.label")}
          </Text>
        ) : (
          <Text variant="2xs" color="glyph-tertiary">
            {t("script_project.no_storyboard_yet.label")}
          </Text>
        )}
      </div>
      {storyboardZoomModal}
    </div>
  );
};
