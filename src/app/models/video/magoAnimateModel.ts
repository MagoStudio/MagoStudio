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

const MAGO_ANIMATE_SETUP = `Transfers a performance from the active video onto one character reference image, using distilled Wan-Animate-2 14B weights.

Install [ComfyUI-KJNodes](https://github.com/kijai/ComfyUI-KJNodes) for the FFN VRAM-chunking node used on every render, then restart ComfyUI.

**Only for GGUF model sizes**, also install these custom-node packs:

- [Rebels w3a8 Loader](https://github.com/RealRebelAI/Rebels_w3a8_Loader) — provides the loader these GGUFs need. It is not in ComfyUI Manager, so clone it by hand. The clone nests the node folder one level too deep, so move that inner folder up into \`custom_nodes\` or ComfyUI will not find the nodes:

\`\`\`
cd ComfyUI/custom_nodes
git clone https://github.com/RealRebelAI/Rebels_w3a8_Loader
\`\`\`

  Then move the node folder that sits inside \`Rebels_w3a8_Loader\` up one level, so it lands directly in \`custom_nodes\`.

- [ComfyUI-GGUF](https://github.com/city96/ComfyUI-GGUF) — required by the Rebels GGUF loader

Needs ComfyUI 0.31.0 or newer, for the native Wan-Animate-2 nodes and the quantization registry.

Download the shared files into the indicated ComfyUI folders:

- [UMT5 text encoder](https://huggingface.co/Comfy-Org/Wan-Animate-2/resolve/main/text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors) → \`models/text_encoders/\`
- [CLIP Vision H](https://huggingface.co/Comfy-Org/Wan-Animate-2/resolve/main/clip_vision/clip_vision_h.safetensors) → \`models/clip_vision/\`
- [Wan 2.1 VAE](https://huggingface.co/Comfy-Org/Wan-Animate-2/resolve/main/vae/Wan2_1_VAE_bf16.safetensors) → \`models/vae/\`

Then download **one** model matching the model size you select:

- **INT8 ConvRot (safetensors)**: [wan_animate_2_distill_int8_convrot.safetensors](https://huggingface.co/Comfy-Org/Wan-Animate-2/resolve/main/diffusion_models/wan_animate_2_distill_int8_convrot.safetensors?download=true) → \`models/diffusion_models/\`. Uses ComfyUI's built-in loader; neither Rebels w3a8 Loader nor ComfyUI-GGUF is needed.

For **GGUF**, download from the \`Distilled\` folder of [realrebelai/Wan-Animate-2_GGUFs](https://huggingface.co/realrebelai/Wan-Animate-2_GGUFs/tree/main/Distilled), into \`models/unet/\`:

- \`Wan-Animate-2-14B-TURBO-Q8_0.gguf\` — closest to the full weights
- \`Wan-Animate-2-14B-TURBO-Q6_K.gguf\` — high quality, smaller
- \`Wan-Animate-2-14B-TURBO-Q4_K_M.gguf\` — around 11 GB, fits 12 GB cards

All options use distilled weights, so the step distillation is already baked in — no speedup LoRA is loaded, and CFG stays at 1.

The active video drives the motion and the reference image supplies the character. Output respects the aspect ratio of the input video and retains the source FPS.`;

const DEFAULT_NEGATIVE_PROMPT =
  "色调艳丽，过曝，静态，细节模糊不清，字幕，风格，作品，画作，画面，静止，整体发灰，最差质量，低质量，JPEG压缩残留，丑陋的，残缺的，多余的手指，画得不好的手部，画得不好的脸部，畸形的，毁容的，形态畸形的肢体，手指融合，静止不动的画面，杂乱的背景，三条腿，背景人很多，倒着走";

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

export const magoAnimateModel: VideoModelDefinition = {
  capabilities: {},
  name: VideoEngine.mago_animate,
  displayName: "Mago Animate (Local)",
  description:
    "Transfer the motion of the active video onto one character reference image using Wan-Animate-2",
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
              key: "mago_animate_setup",
              type: "tool",
              label: "Mago Animate local setup",
              tooltip: MAGO_ANIMATE_SETUP,
              tooltipFormat: "markdown",
              ui: "SetupInfo",
              defaultValue: false,
              nullable: true
            },
            {
              key: "animate_model_size",
              type: "enum",
              label: "Model size",
              tooltip:
                "All options use distilled weights. INT8 ConvRot uses ComfyUI's built-in loader. GGUF sizes require Rebels w3a8 Loader and ComfyUI-GGUF; smaller sizes use less VRAM.",
              ui: "SelectInput",
              options: [
                {
                  value: "int8_convrot",
                  label: "INT8 ConvRot — native loader"
                },
                { value: "Q8_0", label: "GGUF Q8_0 — highest quality" },
                { value: "Q6_K", label: "GGUF Q6_K — balanced" },
                { value: "Q4_K_M", label: "GGUF Q4_K_M — lightest" }
              ],
              defaultValue: "Q4_K_M",
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
              defaultValue: 832,
              nullable: false
            },
            {
              key: "source_image_slot",
              type: "string",
              label: "Character reference",
              labelCaption:
                "The character the motion of the active video is transferred onto",
              tooltip:
                "One clear image of the character. The active video supplies the motion",
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
              key: "prompt",
              type: "string",
              label: "Prompt",
              tooltip:
                "Describe the character and the background, the way the reference image looks",
              ui: "PromptWithEnhancePromptButton",
              defaultValue: "",
              nullable: true,
              specificConfig: { doubleHeight: true }
            },
            {
              key: "pose_prompt",
              type: "string",
              label: "Motion prompt",
              tooltip:
                "Describe the motion in the active video, for example: a girl doing street dance, background stationary",
              ui: "Prompt",
              defaultValue: "",
              nullable: true,
              specificConfig: { hideAutoPrompt: true }
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
              key: "reference_image_strength",
              type: "number",
              label: "Reference strength",
              tooltip:
                "How strongly the character reference image drives the appearance of the render",
              ui: "SliderAndNumberInputFullWidth",
              min: 0,
              max: 2,
              step: 0.05,
              defaultValue: 1,
              nullable: false
            },
            {
              key: "pose_strength",
              type: "number",
              label: "Motion strength",
              tooltip:
                "How strongly the motion of the active video is followed. Lower it if the character is distorted by the pose",
              ui: "SliderAndNumberInputFullWidth",
              min: 0,
              max: 2,
              step: 0.05,
              defaultValue: 1,
              nullable: false
            },
            {
              key: "pose_start_percent",
              type: "number",
              label: "Motion start",
              tooltip:
                "Point in the sampling schedule where the motion starts being applied",
              ui: "SliderAndNumberInput",
              min: 0,
              max: 1,
              step: 0.05,
              defaultValue: 0,
              nullable: false
            },
            {
              key: "pose_end_percent",
              type: "number",
              label: "Motion end",
              tooltip:
                "Point in the sampling schedule where the motion stops being applied",
              ui: "SliderAndNumberInput",
              min: 0,
              max: 1,
              step: 0.05,
              defaultValue: 1,
              nullable: false
            },
            {
              key: "steps",
              type: "number",
              label: "Steps",
              tooltip:
                "Sampling steps. The distilled TURBO weights are tuned for a low count",
              ui: "SliderAndNumberInput",
              min: 2,
              max: 20,
              step: 1,
              defaultValue: 10,
              nullable: false
            },
            {
              key: "cfg",
              type: "number",
              label: "CFG",
              tooltip:
                "Prompt adherence. The distilled weights expect 1; raising it usually hurts",
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
              tooltip: "Sampling shift",
              ui: "SliderAndNumberInput",
              min: 1,
              max: 10,
              step: 1,
              defaultValue: 5,
              nullable: false
            },
            {
              key: "animate_cache_device",
              type: "enum",
              label: "Motion cache device",
              tooltip:
                "Where the Wan-Animate-2 motion cache is held. GPU is faster; CPU frees VRAM on smaller cards",
              ui: "SelectInput",
              options: [
                { value: "gpu", label: "GPU — faster" },
                { value: "cpu", label: "CPU — frees VRAM" }
              ],
              defaultValue: "gpu",
              nullable: false
            },
            {
              key: "animate_cache_dtype",
              type: "enum",
              label: "Motion cache precision",
              tooltip: "Precision of the motion cache",
              ui: "SelectInput",
              options: [
                { value: "int8", label: "int8" },
                { value: "int4", label: "int4" },
                { value: "default", label: "default" }
              ],
              defaultValue: "int8",
              nullable: false
            },
            {
              key: "trim_duplicated_frame",
              type: "boolean",
              label: "Trim duplicated first frame",
              tooltip:
                "Drop the first decoded frame, which repeats the reference pose",
              ui: "SwitchInput",
              defaultValue: false,
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
