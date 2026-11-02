import { Icon } from "@components/Icon";
import { MainButton } from "@components/MainButton";
import { Text } from "@components/Text";
import React from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Img2ImgSchema, Img2ImgType } from "./schemas";

type Preset = {
  titleKey: string;
  modelKey: "gpt_image_2";
  promptKey: string;
  recommendedModelKey: string;
};

export const PRESETS: Preset[] = [
  {
    titleKey: "titles.img2img_empty_state.preset_cinematic_illustrated.title",
    modelKey: "gpt_image_2",
    promptKey: "titles.img2img_empty_state.preset_cinematic_illustrated.prompt",
    recommendedModelKey:
      "titles.img2img_empty_state.preset_cinematic_illustrated.recommended_model"
  },
  {
    titleKey: "titles.img2img_empty_state.preset_change_weather.title",
    modelKey: "gpt_image_2",
    promptKey: "titles.img2img_empty_state.preset_change_weather.prompt",
    recommendedModelKey:
      "titles.img2img_empty_state.preset_change_weather.recommended_model"
  },
  {
    titleKey: "titles.img2img_empty_state.preset_clean_plate.title",
    modelKey: "gpt_image_2",
    promptKey: "titles.img2img_empty_state.preset_clean_plate.prompt",
    recommendedModelKey:
      "titles.img2img_empty_state.preset_clean_plate.recommended_model"
  }
];

interface Props {
  preset: Preset;
}

export const PresetCard: React.FC<Props> = ({ preset }) => {
  const { t } = useTranslation();
  const { reset } = useFormContext<Img2ImgType>();

  const handleReuse = () => {
    const prompt = t(preset.promptKey);
    const defaultValues = Img2ImgSchema.parse({
      model: preset.modelKey,
      prompt
    });
    reset(defaultValues);
  };

  return (
    <div
      data-testid="img2img-preset-card"
      className="flex flex-col items-start gap-1 rounded-lg"
    >
      <Text variant="sm" weight="bold" component="span">
        {t(preset.titleKey)}
      </Text>
      <Text variant="sm" component="span">
        {t(preset.promptKey)}
      </Text>
      <Text variant="sm" color="glyph-secondary" component="span">
        {t("titles.img2img_empty_state.recommended_model_prefix")}{" "}
        {t(preset.recommendedModelKey)}
      </Text>
      <MainButton
        size="sm"
        colorScheme="secondary"
        startIcon={<Icon iconSet="16" iconName="reuse" />}
        onPress={handleReuse}
        className="mt-2"
      >
        {t("actions.use_this_prompt.label")}
      </MainButton>
    </div>
  );
};
