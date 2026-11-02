import { getDurationFromFrameRange } from "@domains/renders/utils/frameDurationLimits";
import {
  ModelCategory,
  PrepareRenderSettingsContext,
  RenderDurationLimits,
  VideoEngine,
  VideoModelDefinition,
  VideoSettings
} from "@models/video/types";
import { computeWanOutputDimensions } from "@models/video/utils/computeWanOutputDimensions";

const STYLE_TRANSFER_SETUP = `Runs the same Wan2.2 Fun Control pipeline as Mago Style Transfer in the cloud, on your own ComfyUI.

Install this custom-node pack with ComfyUI Manager, then restart ComfyUI:

- [ComfyUI-GGUF](https://github.com/city96/ComfyUI-GGUF) — only needed for the GGUF model sizes
- [ComfyUI-KJNodes](https://github.com/kijai/ComfyUI-KJNodes) — provides the FFN VRAM-chunking node used on every render, and the Color consistency node when above 0

Download the shared files into the indicated ComfyUI folders:

- [UMT5 text encoder](https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors) → \`models/text_encoders/\`
- [Wan VAE](https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/vae/wan_2.1_vae.safetensors) → \`models/vae/\`
- [Lightx2v 4-step LoRA — high noise](https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/loras/wan2.2_i2v_lightx2v_4steps_lora_v1_high_noise.safetensors) → \`models/loras/\`
- [Lightx2v 4-step LoRA — low noise](https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/loras/wan2.2_i2v_lightx2v_4steps_lora_v1_low_noise.safetensors) → \`models/loras/\`

Then download **one** matching pair for the model size you select, into \`models/diffusion_models/\` (GGUF pairs go in \`models/unet/\`):

FP8 scaled — highest quality, needs the most VRAM:

- [Fun Control high noise FP8](https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/diffusion_models/wan2.2_fun_control_high_noise_14B_fp8_scaled.safetensors)
- [Fun Control low noise FP8](https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/diffusion_models/wan2.2_fun_control_low_noise_14B_fp8_scaled.safetensors)

GGUF quantisations from [QuantStack/Wan2.2-Fun-A14B-Control-GGUF](https://huggingface.co/QuantStack/Wan2.2-Fun-A14B-Control-GGUF) — pick one quantisation and take **both** the HighNoise and LowNoise file:

- \`HighNoise/Wan2.2-Fun-A14B-Control_HighNoise-<QUANT>.gguf\`
- \`LowNoise/Wan2.2-Fun-A14B-Control_LowNoise-<QUANT>.gguf\`

where \`<QUANT>\` is one of \`Q8_0\`, \`Q6_K\`, \`Q5_K_M\` or \`Q4_K_M\`. Q8_0 is closest to FP8; Q4_K_M is the lightest.

This model sends the active video as the Fun Control control video, blended toward grey by Video input strength, and your stylized reference frame as the starting image. Output respects the aspect ratio of the input video and retains the source FPS.`;

const DEFAULT_NEGATIVE_PROMPT =
  "bad quality, blurry, distorted, deformed, watermark, text, subtitles, static, overexposed, jpeg artifacts, extra fingers, malformed hands, malformed face";

const formatValuesForBackend = (
  settings: VideoSettings,
  context: PrepareRenderSettingsContext
): VideoSettings => {
  const referenceAssetId = context.sources.find(
    (source) => source.type === "key_frame" || source.type === "reference_frame"
  )?.asset_id;
  const { width, height } = computeWanOutputDimensions(
    context.inputVideoWidth,
    context.inputVideoHeight,
    settings.max_size as number
  );
  return {
    ...settings,
    width,
    height,
    fps: context.fps,
    durationInSeconds: getDurationFromFrameRange(
      context.frameRange,
      context.fps
    ),
    frameRangeSeconds: [
      context.frameRange[0] / context.fps,
      context.frameRange[1] / context.fps
    ],
    image_ids: referenceAssetId ? [referenceAssetId] : []
  };
};

export const magoStyleTransferLocalModel: VideoModelDefinition = {
  capabilities: {},
  name: VideoEngine.mago_style_transfer_local,
  displayName: "Mago Style Transfer (Local)",
  description:
    "Restyle the active video from a stylized reference frame using Wan2.2 Fun Control",
  type: "render",
  status: "active",
  category: ModelCategory.TRANSFORMATION_VFX,
  modeAvailability: { isRelaxedModeAvailable: false },
  disableDownload: ["frames", "video+frames"],
  calcEstimatedRenderTime: () => ({ impactToShow: 0 }),
  renderDurationLimits: {
    defaultFrameRange: { defaultRender: 49, testRender: 49 },
    modelLimits: { minFrames: 5, maxFrames: 81 }
  } satisfies RenderDurationLimits,
  settingsGroups: [
    {
      name: "Basic",
      level: "main",
      sections: [
        {
          name: undefined,
          settings: [
            {
              key: "style_transfer_setup",
              type: "tool",
              label: "Mago Style Transfer local setup",
              tooltip: STYLE_TRANSFER_SETUP,
              tooltipFormat: "markdown",
              ui: "SetupInfo",
              defaultValue: false,
              nullable: true
            },
            {
              key: "fun_model_size",
              type: "enum",
              label: "Model size",
              tooltip:
                "FP8 scaled is closest to the cloud render and needs the most VRAM. The GGUF sizes trade quality for VRAM and require ComfyUI-GGUF.",
              ui: "SelectInput",
              options: [
                { value: "fp8_scaled", label: "FP8 scaled — highest quality" },
                { value: "Q8_0", label: "GGUF Q8_0 — near FP8" },
                { value: "Q6_K", label: "GGUF Q6_K — balanced" },
                { value: "Q5_K_M", label: "GGUF Q5_K_M — lighter" },
                { value: "Q4_K_M", label: "GGUF Q4_K_M — lightest" }
              ],
              defaultValue: "fp8_scaled",
              nullable: false
            },
            {
              key: "max_size",
              type: "number",
              label: "Output size",
              tooltip:
                "Size of the longest side of your target output resolution. Lower resolutions will give faster results, at the expense of quality",
              ui: "NumberInput",
              min: 512,
              max: 1920,
              step: 1,
              defaultValue: 1280,
              nullable: false
            },
            {
              key: "source_image_slot",
              type: "string",
              label: "Stylized frame",
              labelCaption:
                "The stylized reference frame the render takes its look from",
              tooltip:
                "Modify a frame of the source video, or upload one, then use it here as the style reference",
              ui: "FileUploaderWithStylizeButton",
              specificConfig: {
                sourceRoles: ["key_frame"],
                isPrimarySourceSlot: true,
                uploadButtonLabel: "Upload image reference",
                uploadButtonSubtitle: "Format .jpg or .png"
              },
              defaultValue: undefined,
              nullable: false,
              errorMessage: "You need to add a stylized reference frame"
            },
            {
              key: "prompt",
              type: "string",
              label: "Prompt",
              tooltip:
                "Describe the look you want. Leave empty to let the reference frame drive the style on its own",
              ui: "PromptWithEnhancePromptButton",
              defaultValue: "",
              nullable: true,
              specificConfig: { doubleHeight: true }
            },
            {
              key: "raw_video_cn_strength",
              type: "number",
              label: "Video input strength",
              tooltip:
                "The higher the value, the higher the fidelity to the original input video will be (shape, facial expressions, lip-sync, outlines, etc.).",
              ui: "SliderAndNumberInputFullWidth",
              min: 0.3,
              max: 1,
              step: 0.1,
              defaultValue: 0.5,
              nullable: false
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
              key: "negative_prompt",
              type: "string",
              label: "Negative prompt",
              tooltip: "Describe what the render should avoid",
              ui: "Prompt",
              defaultValue: DEFAULT_NEGATIVE_PROMPT,
              nullable: true,
              hidingCondition: () => true,
              specificConfig: { hideAutoPrompt: true }
            },
            {
              key: "steps",
              type: "number",
              label: "Steps",
              tooltip:
                "Sampling steps across both the high-noise and low-noise passes. The 4-step speedup LoRA is tuned for 4",
              ui: "SliderAndNumberInput",
              min: 4,
              max: 20,
              step: 1,
              defaultValue: 4,
              nullable: false
            },
            {
              key: "split_step_percentage",
              type: "number",
              label: "High/low split",
              tooltip:
                "Percentage of the steps handled by the high-noise pass before handing over to the low-noise pass",
              ui: "SliderAndNumberInput",
              min: 20,
              max: 80,
              step: 10,
              defaultValue: 40,
              nullable: false,
              specificConfig: { unit: "%" }
            },
            {
              key: "cfg",
              type: "number",
              label: "CFG",
              tooltip:
                "Prompt adherence. The speedup LoRA expects 1; raise it only if you disable the accelerator",
              ui: "SliderAndNumberInput",
              min: 0.5,
              max: 6,
              step: 0.1,
              defaultValue: 1,
              nullable: false
            },
            {
              key: "shift",
              type: "number",
              label: "Shift",
              tooltip: "Sampling shift applied to both passes",
              ui: "SliderAndNumberInput",
              min: 1,
              max: 10,
              step: 1,
              defaultValue: 8,
              nullable: false
            },
            {
              key: "low_step_accelerator",
              type: "number",
              label: "Low step accelerator",
              tooltip:
                "Strength of the 4-step speedup LoRA on both passes. Lower it towards 0 to trade speed for quality",
              ui: "SliderAndNumberInput",
              min: 0,
              max: 1,
              step: 0.01,
              defaultValue: 1,
              nullable: false
            },
            {
              key: "color_match_strength",
              type: "number",
              label: "Color consistency",
              tooltip:
                "Help the render to follow the color palette of the stylized frame reference. Increase the value if the render color is too different from the frame reference and/or if there is some color drifting. Decrease the value when you work on dynamic scenes. Uses an additional ComfyUI-KJNodes node when above 0.",
              ui: "SliderAndNumberInput",
              min: 0,
              max: 1,
              step: 0.01,
              defaultValue: 0,
              nullable: false
            },
            {
              key: "seed",
              type: "number",
              label: "Seed",
              tooltip: "Reuse a seed to reproduce a render",
              ui: "NumberInputFullWidth",
              min: 0,
              max: 2 ** 32 - 1,
              step: 1,
              defaultValue: 42,
              nullable: false
            },
            {
              key: "keyframe_index",
              type: "number",
              label: "Keyframe Index",
              tooltip: "Frame index to use as reference",
              ui: "hidden",
              defaultValue: undefined,
              nullable: true
            }
          ]
        }
      ]
    }
  ],
  formatValuesForBackend
};
