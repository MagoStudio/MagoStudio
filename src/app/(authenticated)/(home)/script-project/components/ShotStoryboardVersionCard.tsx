import { AnimatedGradient } from "@components/AnimatedGradient";
import { Text } from "@components/Text";
import { STORYBOARD_IMAGE_SIZE } from "@domains/scriptProject/constants";
import { useTranslation } from "react-i18next";

import { SheetImageRenderError } from "./SheetImageRenderError";

type Props = {
  storyboardImageUrl: string | undefined;
  isStoryboardRendering: boolean;
  failedStoryboardClipId: string | undefined;
  hasStoryboardFailed: boolean;
  testId: string;
};

export const ShotStoryboardVersionCard: React.FC<Props> = ({
  storyboardImageUrl,
  isStoryboardRendering,
  failedStoryboardClipId,
  hasStoryboardFailed,
  testId
}) => {
  const { t } = useTranslation();

  return (
    <div className="w-full shrink-0" data-testid={testId}>
      <div
        style={{
          aspectRatio: `${STORYBOARD_IMAGE_SIZE.width} / ${STORYBOARD_IMAGE_SIZE.height}`
        }}
        className="relative flex w-full items-center justify-center overflow-hidden rounded-lg bg-surface-primary"
      >
        {isStoryboardRendering ? (
          <AnimatedGradient />
        ) : storyboardImageUrl ? (
          <img
            alt=""
            src={storyboardImageUrl}
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
    </div>
  );
};
