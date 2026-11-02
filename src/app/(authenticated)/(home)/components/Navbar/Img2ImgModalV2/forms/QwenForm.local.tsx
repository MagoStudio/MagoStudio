import { FieldFileDropZone } from "@components/Form/Fields/FieldFileDropZone";
import { FieldPromptWithEnhance } from "@components/Form/Fields/FieldPromptWithEnhance";
import { FieldSelect } from "@components/Form/Fields/FieldSelect";
import { InfoTooltipIcon } from "@components/InfoTooltipIcon";
import { Text } from "@components/Text";
import React from "react";
import { useTranslation } from "react-i18next";

const QWEN_SETUP_OPTIONS = [
  { label: "Native INT8 · Lightning 8-step", key: "native-int8-8step" },
  { label: "GGUF Q5 · Lightning 4-step", key: "gguf-q5-4step" },
  { label: "Flux 2 Klein 4B · Q8", key: "flux2-klein-4b-q8" },
  { label: "Flux 2 Klein 9B · Q8", key: "flux2-klein-9b-q8" }
];

const QWEN_LOCAL_SETUP_TOOLTIP = `### Qwen Image Edit 2511 setup

Both setups share these files:

- \`qwen_2.5_vl_7b_fp8_scaled.safetensors\` → \`models/text_encoders/\`
- \`qwen_image_vae.safetensors\` → \`models/vae/\`

Native INT8 · 8-step:

- \`qwen_image_edit_2511_int8_convrot.safetensors\` → \`models/diffusion_models/\`
- \`Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16.safetensors\` → \`models/loras/\`

GGUF Q5 · 4-step:

- \`Qwen-Image-Edit-2511-Q5_K_M.gguf\` → \`models/unet/\`
- \`Qwen-Image-Edit-2511-Lightning-4steps-V1.0-bf16.safetensors\` → \`models/loras/\`

The GGUF setup also requires ComfyUI-GGUF. Restart ComfyUI after adding files.`;

const LOCAL_IMAGE_SETUP_TOOLTIP = `${QWEN_LOCAL_SETUP_TOOLTIP}

Flux 2 Klein Q8 setups (4-step, text-to-image and image editing):

- \`flux-2-klein-4b-Q8_0.gguf\` + \`qwen_3_4b.safetensors\`
- \`flux-2-klein-9b-Q8_0.gguf\` + \`qwen_3_8b_fp8mixed.safetensors\`
- Both use \`flux2-vae.safetensors\`

GGUF files go in \`models/unet/\`, encoders in \`models/text_encoders/\`, and the VAE in \`models/vae/\`.`;

export const QwenForm: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-1.5">
        <Text variant="xs" color="glyph-secondary">
          Local image engine
        </Text>
        <InfoTooltipIcon
          tooltip={LOCAL_IMAGE_SETUP_TOOLTIP}
          tooltipFormat="markdown"
          labelColor="glyph-tertiary"
        />
      </div>
      <FieldSelect
        name="qwen_image_edit_setup"
        items={QWEN_SETUP_OPTIONS}
        label="Image engine"
      />
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
