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

const VACE_SETUP = `Based on the [official ComfyUI Wan VACE workflow](https://docs.comfy.org/tutorials/video/wan/vace).

Requires these custom-node packs, cloned into \`ComfyUI/custom_nodes/\` (then restart ComfyUI):

- [comfyui_controlnet_aux](https://github.com/Fannovel16/comfyui_controlnet_aux) for the depth and pose preprocessors; its DepthAnythingV2 and DWPose checkpoints download automatically on first run.
- [ComfyUI-KJNodes](https://github.com/kijai/ComfyUI-KJNodes) for the FFN VRAM-chunking node used on every render.

Use a current ComfyUI build, then download these files into the indicated folders:

- [Wan 2.1 VACE 14B FP8 diffusion model](https://huggingface.co/Kamikaze-88/Wan2.1-VACE-14B-fp8/resolve/main/wan2.1_vace_14B_fp8_e4m3fn.safetensors) → \`models/diffusion_models/\`
- [Wan 2.1 VACE 1.3B FP16 diffusion model](https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/diffusion_models/wan2.1_vace_1.3B_fp16.safetensors) → \`models/diffusion_models/\`
- [UMT5 text encoder](https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors) → \`models/text_encoders/\`
- [Wan VAE](https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/vae/wan_2.1_vae.safetensors) → \`models/vae/\`

This model derives a depth map and a pose map from the active video and feeds both to VACE as chained control signals, with one uploaded or generated image as its visual reference. The raw video is never sent as control video. Output respects the aspect ratio of the input video and retains the source FPS.`;

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

export const wanVace21Model: VideoModelDefinition = {
  capabilities: {},
  name: VideoEngine.wan_vace_2_1,
  displayName: "Wan VACE (Local)",
  description:
    "Transform the active video with one reference image using Wan 2.1 VACE",
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
              key: "vace_setup",
              type: "tool",
              label: "Wan VACE local setup",
              tooltip: VACE_SETUP,
              tooltipFormat: "markdown",
              ui: "SetupInfo",
              defaultValue: false,
              nullable: true
            },
            {
              key: "vace_model_size",
              type: "enum",
              label: "Model size",
              tooltip:
                "14B FP8 provides higher quality. 1.3B FP16 is substantially lighter and intended for 480p-class generation.",
              ui: "SelectInput",
              options: [
                { value: "14b_fp8", label: "14B FP8 — higher quality" },
                { value: "1.3b_fp16", label: "1.3B FP16 — lightweight" }
              ],
              defaultValue: "14b_fp8",
              nullable: false
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
              tooltip: "Describe how the source video should be transformed",
              ui: "PromptWithEnhancePromptButton",
              defaultValue:
                "Transform the source video using the reference image while preserving its motion",
              nullable: false,
              errorMessage: "You need to add a prompt",
              specificConfig: { doubleHeight: true }
            },
            {
              key: "source_image_slot",
              type: "string",
              label: "Reference image",
              labelCaption:
                "Upload an image that defines the desired subject or appearance",
              tooltip:
                "One uploaded or generated image that defines the desired subject or appearance",
              ui: "FileUploaderWithStylizeButton",
              specificConfig: {
                sourceRoles: ["key_frame"],
                isPrimarySourceSlot: true,
                uploadButtonLabel: "Upload image reference",
                uploadButtonSubtitle: "Format .jpg or .png"
              },
              defaultValue: undefined,
              nullable: false,
              errorMessage: "You need to add a reference image"
            },
            {
              key: "vace_depth_strength",
              type: "number",
              label: "Depth strength",
              tooltip:
                "How strongly the depth map extracted from the source video conditions the render. Lower it to let the reference image reshape the scene.",
              ui: "SliderAndNumberInputFullWidth",
              min: 0.1,
              max: 1,
              step: 0.05,
              defaultValue: 0.5,
              nullable: false
            },
            {
              key: "vace_pose_strength",
              type: "number",
              label: "Pose strength",
              tooltip:
                "How strongly the body, hand and face pose extracted from the source video conditions the render. Lower it if the subject stays too close to the source.",
              ui: "SliderAndNumberInputFullWidth",
              min: 0.1,
              max: 1,
              step: 0.05,
              defaultValue: 0.5,
              nullable: false
            }
          ]
        }
      ]
    }
  ],
  formatValuesForBackend
};
