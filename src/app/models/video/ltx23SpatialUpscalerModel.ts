import {
  ModelCategory,
  PrepareRenderSettingsContext,
  RenderDurationLimits,
  VideoEngine,
  VideoModelDefinition,
  VideoSettings
} from "@models/video/types";

const LTX_UPSCALE_SETUP = `Creatively upscales the active video with the LTX-2.3 distilled model and the official Pixel Spatial Upscaler IC-LoRAs.

Install these custom-node packs, then restart ComfyUI:

- [ComfyUI-LTXVideo](https://github.com/Lightricks/ComfyUI-LTXVideo/)
- [ComfyUI-GGUF](https://github.com/city96/ComfyUI-GGUF)
- [ComfyUI-MagoNodes](https://github.com/MagoStudio/ComfyUI-MagoNodes) — provides the LTX tiled sampler that keeps IC-LoRA sampling within practical VRAM limits

Download the model files into these ComfyUI folders:

- \`models/unet/ltx-2.3-22b-distilled-1.1-UD-Q5_K_M.gguf\`
- \`models/text_encoders/gemma_3_12B_it_fp4_mixed.safetensors\`
- \`models/text_encoders/ltx-2.3-22b-dev_embeddings_connectors.safetensors\`
- \`models/vae/ltx-2.3-22b-distilled_video_vae.safetensors\`
- \`models/vae/ltx-2.3-22b-distilled_audio_vae.safetensors\`

Download both Pixel Spatial Upscaler LoRAs into \`models/loras/\`:

- [x2 LoRA](https://huggingface.co/Lightricks/LTX-2.3-22b-IC-LoRA-Pixel-Spatial-Upscaler/resolve/main/ltx-2.3-22b-ic-lora-pixel-spatial-upscaler-x2-0.9.safetensors?download=true): \`ltx-2.3-22b-ic-lora-pixel-spatial-upscaler-x2-0.9.safetensors\`
- [x4 LoRA](https://huggingface.co/Lightricks/LTX-2.3-22b-IC-LoRA-Pixel-Spatial-Upscaler/resolve/main/ltx-2.3-22b-ic-lora-pixel-spatial-upscaler-x4-0.9.safetensors?download=true): \`ltx-2.3-22b-ic-lora-pixel-spatial-upscaler-x4-0.9.safetensors\`

The output keeps the exact input aspect ratio. Mago pads the processing canvas to LTX's required pixel grid, then removes that padding from the finished video. The model synthesizes new detail, so it is a creative upscale rather than pixel-exact interpolation.`;

const DEFAULT_PROMPT =
  "high quality, crisp natural detail, realistic textures, clean edges, temporally consistent";
const DEFAULT_NEGATIVE_PROMPT =
  "low quality, blurry, compression artifacts, distorted details, flicker, text, watermark";
export const computeLtxUpscaleDimensions = (
  width: number | undefined,
  height: number | undefined,
  factor: number
): { width: number; height: number } => {
  const safeFactor = factor === 4 ? 4 : 2;
  return {
    width: Math.max(2, Math.round((width ?? 512) * safeFactor)),
    height: Math.max(2, Math.round((height ?? 512) * safeFactor))
  };
};

const formatValuesForBackend = (
  settings: VideoSettings,
  context: PrepareRenderSettingsContext
): VideoSettings => {
  const factor = Number(settings.ltx_upscale_factor) === 4 ? 4 : 2;
  return {
    ...settings,
    prompt: DEFAULT_PROMPT,
    ltx_upscale_lora_strength: 1,
    ltx_upscale_factor: factor,
    ...computeLtxUpscaleDimensions(
      context.inputVideoWidth,
      context.inputVideoHeight,
      factor
    )
  };
};

export const ltx23SpatialUpscalerModel: VideoModelDefinition = {
  capabilities: {},
  name: VideoEngine.ltx_2_3_spatial_upscaler,
  displayName: "LTX 2.3 Spatial Upscaler (Local)",
  description: "Creative x2 or x4 video upscaling with LTX-2.3",
  type: "render",
  status: "active",
  category: ModelCategory.UPSCALE,
  modeAvailability: { isRelaxedModeAvailable: false },
  calcEstimatedRenderTime: () => ({ impactToShow: 0 }),
  renderDurationLimits: {
    defaultFrameRange: { defaultRender: 49, testRender: 17 },
    modelLimits: { minFrames: 1, maxFrames: 257 }
  } satisfies RenderDurationLimits,
  isSourceImageRequired: false,
  settingsGroups: [
    {
      name: "Basic",
      level: "main",
      sections: [
        {
          name: undefined,
          settings: [
            {
              key: "ltx_upscale_setup",
              type: "tool",
              label: "LTX 2.3 local setup",
              tooltip: LTX_UPSCALE_SETUP,
              tooltipFormat: "markdown",
              ui: "SetupInfo",
              defaultValue: false,
              nullable: true
            },
            {
              key: "ltx_upscale_factor",
              type: "enum",
              label: "Upscale factor",
              tooltip:
                "Selects the matching Pixel Spatial Upscaler LoRA and calculates the output resolution from the input video.",
              ui: "SelectInput",
              options: [
                { value: "2", label: "x2" },
                { value: "4", label: "x4" }
              ],
              defaultValue: "4",
              nullable: false
            },
            {
              key: "prompt",
              type: "string",
              label: "Prompt",
              tooltip: "Describe the detail and appearance to synthesize",
              ui: "hidden",
              defaultValue: DEFAULT_PROMPT,
              nullable: true
            }
          ]
        }
      ]
    },
    {
      name: "Advanced",
      level: "advanced",
      sections: [
        {
          name: undefined,
          settings: [
            {
              key: "ltx_upscale_lora_strength",
              type: "number",
              label: "Upscale creativity",
              tooltip:
                "Strength of the spatial-upscaler LoRA. Lower values preserve the source more closely; higher values synthesize more detail.",
              ui: "hidden",
              min: 0,
              max: 1.5,
              step: 0.05,
              defaultValue: 1,
              nullable: false
            },
            {
              key: "tile_base_size",
              type: "number",
              label: "Tile size",
              tooltip:
                "Target spatial tile size in output pixels. Smaller tiles reduce peak VRAM use but increase render time.",
              ui: "SliderAndNumberInputFullWidth",
              min: 512,
              max: 2048,
              step: 64,
              defaultValue: 1024,
              nullable: false
            },
            {
              key: "negative_prompt",
              type: "string",
              label: "Negative prompt",
              tooltip: "Describe artifacts the upscale should avoid",
              ui: "Prompt",
              defaultValue: DEFAULT_NEGATIVE_PROMPT,
              nullable: true,
              hidingCondition: () => true,
              specificConfig: { hideAutoPrompt: true }
            },
            {
              key: "seed",
              type: "number",
              label: "Seed",
              tooltip: "Reuse a seed to reproduce an upscale",
              ui: "NumberInputFullWidth",
              min: 0,
              max: 2 ** 32 - 1,
              step: 1,
              defaultValue: 42,
              nullable: false
            }
          ]
        }
      ]
    }
  ],
  formatValuesForBackend,
  formatValuesForFrontend: (values) => ({
    ...values,
    ltx_upscale_factor: Number(values.ltx_upscale_factor) === 2 ? "2" : "4"
  })
};
