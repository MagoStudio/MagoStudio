import { Icon } from "@components/Icon";
import { MainButton } from "@components/MainButton";
import { Modal } from "@components/Modal";
import { Tag } from "@components/Tag";
import { Text } from "@components/Text";
import { useImageAsset } from "@domains/asset/useImageAsset";
import { useOnboardingProgress } from "@domains/onboarding/useOnboardingProgress";
import { buildOnboardingVideoPrompt } from "@domains/onboarding/utils/buildOnboardingVideoPrompt";
import { useInputTrackFrameSrc } from "@domains/track/useInputTrackFrameSrc";
import { trackingUtils } from "@hooks/tracking/trackingUtils";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { cn } from "@utils";
import { useSetAtom } from "jotai";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { OnboardingFramePreview } from "./OnboardingFramePreview";
import { useGenerateOnboardingVideoRender } from "./useGenerateOnboardingVideoRender";

const FIRST_FRAME = 0;

export const OnboardingRenderModal: React.FC = () => {
  const { t } = useTranslation();
  const [{ selectedImageAssetId, renderSubmitted }, setProgress] =
    useOnboardingProgress();
  const { updateValueAtom } = useRenderSettingsAtoms();
  const updateValue = useSetAtom(updateValueAtom);
  const { generate } = useGenerateOnboardingVideoRender();

  const { data: selectedImageAsset } = useImageAsset({
    assetId: selectedImageAssetId,
    enabled: Boolean(selectedImageAssetId)
  });
  const stylizedFrameSrc = selectedImageAsset?.urlToUse;
  const { inputTrackFrameSrc } = useInputTrackFrameSrc({
    frameNumber: FIRST_FRAME
  });

  const [prompt, setPrompt] = useState(
    t("titles.onboarding_render_prompt.default_prompt")
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSent = Boolean(renderSubmitted);

  const handleGenerate = async () => {
    setIsSubmitting(true);
    const imageIds = selectedImageAssetId ? [selectedImageAssetId] : [];
    const finalPrompt = buildOnboardingVideoPrompt(prompt, imageIds);
    updateValue({ key: "prompt", value: finalPrompt, preservePreset: true });
    try {
      const didSubmit = await generate(finalPrompt);
      if (didSubmit) {
        setProgress((prev) => ({ ...prev, renderSubmitted: true }));
        trackingUtils.onboardingActions.firstRender();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    setProgress((prev) => ({ ...prev, step: "tutorial" }));
  };

  return (
    <Modal
      open
      enterAnimation
      onClose={() => undefined}
      preventOutsideClick
      showCloseButton={false}
      fullHeight
      widthClassName="w-screen lg:w-[clamp(880px,calc(80vw_-_144px),1392px)]"
      surfaceClassName="bg-transparent bg-gradient-200"
      contentClassName="px-5 py-12"
    >
      <div className="relative flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-10">
        <div
          className={cn(
            "flex shrink-0 items-center gap-4",
            isSent && "pointer-events-none blur-[24px] opacity-30"
          )}
        >
          <div
            data-testid="onboarding-render-edited-frame"
            className="h-[194px] w-[344px] shrink-0"
          >
            <OnboardingFramePreview
              src={stylizedFrameSrc}
              variant="fill"
              label={t("titles.onboarding_render_frame_edited.label")}
            />
          </div>
          <div className="flex shrink-0 flex-col items-center gap-3">
            <Tag>{t("titles.onboarding_render_apply_to.label")}</Tag>
            <Icon
              iconSet="decorators"
              iconName="connector-arrow"
              className="text-glyph-primary-on-pic"
            />
          </div>
          <div
            data-testid="onboarding-render-input-frame"
            className="h-[194px] w-[352px] shrink-0"
          >
            <OnboardingFramePreview
              src={inputTrackFrameSrc}
              variant="fill"
              label={t("titles.onboarding_render_frame_input.label")}
            />
          </div>
        </div>
        {isSent ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 text-center">
            <Icon
              iconSet="pixels"
              iconName="checkmark"
              className="size-[52px] text-glyph-success"
            />
            <Text
              variant="xl"
              weight="bold"
              color="glyph-primary-on-pic"
              align="center"
              className="max-w-[604px]"
            >
              {t("titles.onboarding_render_done.label")}
            </Text>
            <MainButton onPress={handleFinish}>
              {t("actions.open_mago.label")}
            </MainButton>
          </div>
        ) : (
          <div className="flex w-[620px] shrink-0 flex-col gap-5">
            <Text
              component="h2"
              variant="xl"
              weight="bold"
              color="glyph-primary-on-pic"
              align="center"
            >
              {t("titles.onboarding_render_sending.label")}
            </Text>
            <textarea
              className="min-h-[166px] w-full resize-none rounded bg-element-for-hover p-2 text-md text-glyph-primary-on-pic placeholder:text-glyph-disabled scrollbar-custom"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t("titles.onboarding_render_prompt.placeholder")}
              aria-label={t("titles.onboarding_render_prompt.placeholder")}
            />
            <MainButton
              fullWidth
              loading={isSubmitting}
              isDisabled={isSubmitting || prompt.trim().length === 0}
              onPress={handleGenerate}
              startIcon={<Icon iconSet="16-filled" iconName="video" />}
            >
              {t("actions.generate_my_video.label")}
            </MainButton>
          </div>
        )}
      </div>
    </Modal>
  );
};
