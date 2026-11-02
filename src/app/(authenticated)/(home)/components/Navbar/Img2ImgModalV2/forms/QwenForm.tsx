import { FieldFileDropZone } from "@components/Form/Fields/FieldFileDropZone";
import { FieldPromptWithEnhance } from "@components/Form/Fields/FieldPromptWithEnhance";
import { InfoTooltipIcon } from "@components/InfoTooltipIcon";
import { Text } from "@components/Text";
import React from "react";
import { useTranslation } from "react-i18next";

const QWEN_LOCAL_SETUP_TOOLTIP = `### Qwen Image Edit 2511 setup

Download these files into your ComfyUI model folders:

- [Diffusion model](https://huggingface.co/Comfy-Org/Qwen-Image-Edit_ComfyUI/blob/main/split_files/diffusion_models/qwen_image_edit_2511_int8_convrot.safetensors) → \`models/diffusion_models/\`
- [Qwen 2.5 VL encoder](https://huggingface.co/Comfy-Org/Qwen-Image_ComfyUI/blob/main/split_files/text_encoders/qwen_2.5_vl_7b_fp8_scaled.safetensors) → \`models/text_encoders/\`
- [Qwen Image VAE](https://huggingface.co/Comfy-Org/Qwen-Image_ComfyUI/blob/main/split_files/vae/qwen_image_vae.safetensors) → \`models/vae/\`
- [Lightning 8-step LoRA](https://huggingface.co/lightx2v/Qwen-Image-Edit-2511-Lightning/blob/main/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16.safetensors) → \`models/loras/\`

Restart ComfyUI after downloading the files.`;

export const QwenForm: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-1.5">
        <Text variant="xs" color="glyph-secondary">
          Qwen local setup
        </Text>
        <InfoTooltipIcon
          tooltip={QWEN_LOCAL_SETUP_TOOLTIP}
          tooltipFormat="markdown"
          labelColor="glyph-tertiary"
        />
      </div>
      <FieldPromptWithEnhance
        name="prompt"
        label={t("img2imgForms.common.prompt.label")}
        tooltip={t("img2imgForms.qwen.prompt.tooltip")}
      />
      <FieldFileDropZone
        name="referenceImages"
        text={t("img2imgForms.common.image_style_reference.upload_text")}
        label={t("img2imgForms.common.image_style_reference.label")}
        tooltip={t("img2imgForms.common.image_style_reference.tooltip")}
        maxFileUpload={2}
      />
    </div>
  );
};
