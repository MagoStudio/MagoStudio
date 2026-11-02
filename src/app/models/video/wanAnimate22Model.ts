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

const WAN_SETUP = `Based on the [official ComfyUI Wan2.2 Animate workflow](https://docs.comfy.org/tutorials/video/wan/wan2-2-animate).

Install these custom-node packs with ComfyUI Manager, then restart ComfyUI:

- [ComfyUI-KJNodes](https://github.com/kijai/ComfyUI-KJNodes)
- [ControlNet Auxiliary Preprocessors](https://github.com/Fannovel16/comfyui_controlnet_aux)
- [ComfyUI Segment Anything 2](https://github.com/kijai/ComfyUI-segment-anything-2) — required for Mix mode

Download the models into the indicated ComfyUI folders:

- [Wan2.2 Animate FP8 diffusion model](https://huggingface.co/Kijai/WanVideo_comfy_fp8_scaled/resolve/main/Wan22Animate/Wan2_2-Animate-14B_fp8_e4m3fn_scaled_KJ.safetensors) → \`models/diffusion_models/\`
- [UMT5 text encoder](https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors) → \`models/text_encoders/\`
- [Wan VAE](https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/vae/wan_2.1_vae.safetensors) → \`models/vae/\`
- [CLIP Vision H](https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/clip_vision/clip_vision_h.safetensors) → \`models/clip_vision/\`
- [Lightx2v LoRA](https://huggingface.co/Kijai/WanVideo_comfy/resolve/main/Lightx2v/lightx2v_I2V_14B_480p_cfg_step_distill_rank64_bf16.safetensors) → \`models/loras/\`
- [Wan Animate relight LoRA](https://huggingface.co/Kijai/WanVideo_comfy/resolve/main/LoRAs/Wan22_relight/WanAnimate_relight_lora_fp16.safetensors) → \`models/loras/\`

SAM2 and DWPose support files are downloaded by their custom nodes on first use. Mix mode identifies the subject from the center of the first source-video frame.`;

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

export const wanAnimate22Model: VideoModelDefinition = {
  capabilities: {},
  name: VideoEngine.wan_animate_2_2,
  displayName: "Wan2.2 Animate (Local)",
  description:
    "Replace or animate a character using an active video and one reference image",
  type: "render",
  status: "active",
  category: ModelCategory.CHARACTER_REPLACEMENT,
  modeAvailability: { isRelaxedModeAvailable: false },
  disableDownload: ["frames", "video+frames"],
  calcEstimatedRenderTime: () => ({ impactToShow: 0 }),
  renderDurationLimits: {
    defaultFrameRange: { defaultRender: 49, testRender: 49 },
    modelLimits: { minFrames: 5, maxFrames: 77 }
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
              key: "wan_setup",
              type: "tool",
              label: "Wan2.2 local setup",
              tooltip: WAN_SETUP,
              tooltipFormat: "markdown",
              ui: "SetupInfo",
              defaultValue: false,
              nullable: true
            },
            {
              key: "max_size",
              type: "number",
              label: "Output size",
              tooltip:
                "Size of the longest side of your target output resolution. Lower resolutions will give faster and cheaper results, at the expense of quality",
              ui: "NumberInput",
              min: 512,
              max: 1920,
              step: 1,
              defaultValue: 1280,
              nullable: false
            },
            {
              key: "prompt",
              type: "string",
              label: "Prompt",
              tooltip: "Describe the desired character and result",
              ui: "PromptWithEnhancePromptButton",
              defaultValue:
                "Replace the person while preserving their motion and the scene",
              nullable: false,
              errorMessage: "You need to add a prompt",
              specificConfig: { doubleHeight: true }
            },
            {
              key: "source_image_slot",
              type: "string",
              label: "Character reference",
              labelCaption:
                "Upload a character image to animate or place into the source video",
              tooltip:
                "One clear image of the character to animate or place into the source video",
              ui: "FileUploaderWithStylizeButton",
              specificConfig: {
                sourceRoles: ["key_frame"],
                isPrimarySourceSlot: true,
                uploadButtonLabel: "Upload image reference",
                uploadButtonSubtitle: "Format .jpg or .png"
              },
              defaultValue: undefined,
              nullable: false,
              errorMessage: "You need to add a character reference image"
            },
            {
              key: "wan_mode",
              type: "enum",
              label: "Mode",
              tooltip:
                "Mix replaces the centered source subject and preserves the background. Move transfers motion to the reference image.",
              ui: "SelectInput",
              options: [
                { value: "mix", label: "Mix — replace subject" },
                { value: "move", label: "Move — transfer motion" }
              ],
              defaultValue: "mix",
              nullable: false
            }
          ]
        }
      ]
    }
  ],
  formatValuesForBackend
};
