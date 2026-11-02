import { FieldFileDropZone } from "@components/Form/Fields/FieldFileDropZone";
import { FieldPromptWithEnhance } from "@components/Form/Fields/FieldPromptWithEnhance";
import { FieldSelect } from "@components/Form/Fields/FieldSelect";
import { useIsOnboardingActive } from "@domains/onboarding/useIsOnboardingActive";
import React from "react";
import { useTranslation } from "react-i18next";

import {
  GPT_IMAGE_2_MASK_EXAMPLE_IMAGE,
  GPT_IMAGE_2_QUALITIES
} from "../schemas/gptImage2.schema";

const QUALITY_OPTIONS = GPT_IMAGE_2_QUALITIES.map((quality) => ({
  label: quality,
  key: quality
}));

export const GptImage2Form: React.FC = () => {
  const { t } = useTranslation();
  const isOnboardingActive = useIsOnboardingActive();

  return (
    <div className="flex flex-col gap-4">
      <FieldPromptWithEnhance
        name="prompt"
        label={t("img2imgForms.common.prompt.label")}
        tooltip={t("img2imgForms.gpt_image_2.prompt.tooltip")}
      />
      {!isOnboardingActive && (
        <FieldSelect
          name="quality"
          items={QUALITY_OPTIONS}
          label={t("img2imgForms.gpt_image_2.quality.label")}
          tooltip={t("img2imgForms.gpt_image_2.quality.tooltip")}
        />
      )}
      <FieldFileDropZone
        name="referenceImages"
        text={t("img2imgForms.common.image_style_reference.upload_text")}
        label={t("img2imgForms.common.image_style_reference.label")}
        tooltip={t("img2imgForms.common.image_style_reference.tooltip")}
        maxFileUpload={9}
      />
      {!isOnboardingActive && (
        <FieldFileDropZone
          name="maskImages"
          text={t("img2imgForms.gpt_image_2.mask_image.upload_text")}
          label={t("img2imgForms.gpt_image_2.mask_image.label")}
          tooltip={t("img2imgForms.gpt_image_2.mask_image.tooltip")}
          tooltipImage={GPT_IMAGE_2_MASK_EXAMPLE_IMAGE}
          maxFileUpload={1}
        />
      )}
    </div>
  );
};
