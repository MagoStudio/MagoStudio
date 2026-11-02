import { findMiniMaxH3EditedFrame } from "@domains/renders/utils/findMiniMaxH3EditedFrame";
import { getDurationFromFrameRange } from "@domains/renders/utils/frameDurationLimits";
import { resolveMiniMaxH3EditedFrameSourceFrame } from "@domains/renders/utils/resolveMiniMaxH3EditedFrameSourceFrame";
import {
  DEFAULT_ASPECT_RATIO_ID,
  SCRIPT_PROJECT_ASPECT_RATIOS,
  ScriptProjectAspectRatioId
} from "@domains/scriptProject/constants";
import {
  ModelCategory,
  PrepareRenderSettingsContext,
  RenderDurationLimits,
  VideoEngine,
  VideoModelDefinition,
  VideoSettings
} from "@models/video/types";
import { IMAGE_UPLOAD_LIMITS } from "@utils/image/imageUploadLimits";

import {
  doesMiniMaxH3VfxModeKeepSourceShape,
  MINIMAX_H3_VFX_DEFAULT_LORA_STRENGTH,
  MINIMAX_H3_VFX_LORA_STRENGTH_RANGE,
  type MiniMaxH3VfxMode,
  resolveMiniMaxH3VfxLora,
  resolveMiniMaxH3VfxMode
} from "../../../../desktop/shared/minimaxH3VfxModes";

import { referenceFrameAssetIdsFromSources } from "./referenceFrameAssetIdsFromSources";

const MINIMAX_H3_LOCAL_MAX_REFERENCE_IMAGES = 9;

/** The short edges local H3 renders at. Its own list rather than the script
 *  project's, which moved to 768p/1080p: on a local GPU the smaller sizes are
 *  the point. */
const MINIMAX_H3_LOCAL_RESOLUTIONS = [
  { id: "480p", shortEdgePx: 480 },
  { id: "720p", shortEdgePx: 720 },
  { id: "1080p", shortEdgePx: 1080 }
] as const;

type MinimaxH3LocalResolutionId =
  (typeof MINIMAX_H3_LOCAL_RESOLUTIONS)[number]["id"];

const MINIMAX_H3_LOCAL_RESOLUTION_IDS = MINIMAX_H3_LOCAL_RESOLUTIONS.map(
  (resolution) => resolution.id
);

const DEFAULT_RESOLUTION_ID: MinimaxH3LocalResolutionId = "720p";

/** Render sizes must be a multiple of this; models reject or silently pad odd dimensions. */
const DIMENSION_STEP_PX = 8;

const roundToStep = (value: number): number =>
  Math.max(1, Math.round(value / DIMENSION_STEP_PX)) * DIMENSION_STEP_PX;

const buildOutputSize = (
  aspectRatioId: ScriptProjectAspectRatioId,
  resolutionId: MinimaxH3LocalResolutionId
): [number, number] => {
  const ratio =
    SCRIPT_PROJECT_ASPECT_RATIOS.find((item) => item.id === aspectRatioId) ??
    SCRIPT_PROJECT_ASPECT_RATIOS[0];
  const shortEdgePx =
    MINIMAX_H3_LOCAL_RESOLUTIONS.find((item) => item.id === resolutionId)
      ?.shortEdgePx ?? MINIMAX_H3_LOCAL_RESOLUTIONS[1].shortEdgePx;
  const pixelsPerUnit =
    shortEdgePx / Math.min(ratio.widthUnits, ratio.heightUnits);
  return [
    roundToStep(ratio.widthUnits * pixelsPerUnit),
    roundToStep(ratio.heightUnits * pixelsPerUnit)
  ];
};

const buildOutputSizeFromSourceVideo = (
  sourceWidth: number,
  sourceHeight: number,
  resolutionId: MinimaxH3LocalResolutionId
): [number, number] => {
  const shortEdgePx =
    MINIMAX_H3_LOCAL_RESOLUTIONS.find((item) => item.id === resolutionId)
      ?.shortEdgePx ?? MINIMAX_H3_LOCAL_RESOLUTIONS[1].shortEdgePx;
  const pixelsPerSourcePixel =
    shortEdgePx / Math.min(sourceWidth, sourceHeight);
  return [
    roundToStep(sourceWidth * pixelsPerSourcePixel),
    roundToStep(sourceHeight * pixelsPerSourcePixel)
  ];
};

const MINIMAX_H3_VFX_MODE_OPTIONS: {
  value: MiniMaxH3VfxMode;
  label: string;
}[] = [
  { value: "none", label: "Multipurpose" },
  { value: "vfx_edit", label: "VFX edit" },
  { value: "head_swap", label: "Head swap" },
  { value: "character_swap", label: "Character swap" },
  { value: "style_transfer", label: "Style transfer" }
];

const isVfxModeSelected = (
  settings: Record<string, unknown>,
  mode: MiniMaxH3VfxMode
): boolean => resolveMiniMaxH3VfxMode(settings.vfx_mode) === mode;

const doesVfxModeTakeReferenceImages = (
  settings: Record<string, unknown>
): boolean =>
  resolveMiniMaxH3VfxLora(resolveMiniMaxH3VfxMode(settings.vfx_mode), false)
    ?.referenceImageRule !== "none";

const doesVfxModeRequireReferenceImage = (
  settings: Record<string, unknown>
): boolean =>
  resolveMiniMaxH3VfxLora(resolveMiniMaxH3VfxMode(settings.vfx_mode), false)
    ?.referenceImageRule === "required";

const doesVfxModeKeepSourceShape = (
  settings: Record<string, unknown>
): boolean =>
  doesMiniMaxH3VfxModeKeepSourceShape(
    resolveMiniMaxH3VfxMode(settings.vfx_mode)
  );

const resolveAspectRatioId = (value: unknown): ScriptProjectAspectRatioId =>
  SCRIPT_PROJECT_ASPECT_RATIOS.find((ratio) => ratio.id === value)?.id ??
  DEFAULT_ASPECT_RATIO_ID;

const resolveResolutionId = (value: unknown): MinimaxH3LocalResolutionId =>
  MINIMAX_H3_LOCAL_RESOLUTION_IDS.find((resolution) => resolution === value) ??
  DEFAULT_RESOLUTION_ID;

const formatValuesForBackend = (
  settings: VideoSettings,
  context: PrepareRenderSettingsContext
): VideoSettings => {
  const vfxMode = resolveMiniMaxH3VfxMode(settings.vfx_mode);
  const resolutionId = resolveResolutionId(settings.resolution);
  const doesVfxModeHideAspectRatio =
    doesMiniMaxH3VfxModeKeepSourceShape(vfxMode);
  const isSourceVideoSizeKnown =
    !!context.inputVideoWidth && !!context.inputVideoHeight;
  const shouldKeepSourceShape =
    doesVfxModeHideAspectRatio && isSourceVideoSizeKnown;
  const [width, height] = shouldKeepSourceShape
    ? buildOutputSizeFromSourceVideo(
        context.inputVideoWidth!,
        context.inputVideoHeight!,
        resolutionId
      )
    : buildOutputSize(
        doesVfxModeHideAspectRatio
          ? DEFAULT_ASPECT_RATIO_ID
          : resolveAspectRatioId(settings.aspect_ratio),
        resolutionId
      );
  const editedFrame =
    vfxMode === "vfx_edit"
      ? findMiniMaxH3EditedFrame(context.sources)
      : undefined;
  return {
    ...settings,
    width,
    height,
    fps: context.fps,
    durationInSeconds: getDurationFromFrameRange(
      context.frameRange,
      context.fps
    ),
    image_ids: doesVfxModeTakeReferenceImages(settings)
      ? referenceFrameAssetIdsFromSources(context.sources).slice(
          0,
          MINIMAX_H3_LOCAL_MAX_REFERENCE_IMAGES
        )
      : [],
    vfx_edited_frame_id: editedFrame?.asset_id,
    vfx_edited_frame_source_frame: resolveMiniMaxH3EditedFrameSourceFrame({
      renderSettingsValues: settings,
      editedFrame
    })
  };
};

const MINIMAX_H3_MULTIPURPOSE_DEFAULT_PROMPT =
  "This is a prompt example:\nKeep the motion, timing and camera movement from <Video 1>, and replace the girl with the kitten from <Picture 1>. Keep the kitten’s fur, markings, eye color and proportions identical to <Picture 1>; <Picture 1> wins on appearance, <Video 1> wins on motion. The kitten moves naturally on four legs, following the girl’s path and pacing. Keep the original background and lighting. Photorealistic. Ambient scene sound only, no music.";

const MINIMAX_H3_STYLE_TRANSFER_DEFAULT_PROMPT =
  "This is a prompt example:\nRestyle <Video 1> in the art style of <Picture 1>. Transfer its color palette, brushwork, line quality and texture to every frame. Keep the original content, composition, characters, motion, timing and camera movement of <Video 1> unchanged. Apply the style consistently across all frames, with no flicker and no shifting details.";

const MINIMAX_H3_CHARACTER_SWAP_DEFAULT_PROMPT =
  "This is a prompt example:\nReplace the girl in <Video 1> with the kitten from <Picture 1>. Keep the kitten’s fur color, markings, eye color and proportions identical to <Picture 1>. The kitten moves naturally on four legs, following the girl’s path, timing and actions. Keep the camera movement, framing, background and lighting of <Video 1> unchanged. Consistent appearance across all frames.";

const MINIMAX_H3_HEAD_SWAP_DEFAULT_PROMPT =
  "This is a prompt example:\nReplace the girl’s head in <Video 1> with the kitten’s head from <Picture 1>. Keep the kitten’s fur, markings, ears, whiskers and eye color identical to <Picture 1>. Match the girl’s head turns, tilts and expressions, and blend the fur naturally at the neck. Keep her body, clothing, motion, background and lighting unchanged.";

const MINIMAX_H3_VFX_EDIT_DEFAULT_PROMPT =
  "This is a prompt example:\nAnimate the giant wave from the first frame. It rises behind the girl, curls over and crashes down around her, with spray and foam flying through the air. Keep the girl’s motion, the camera movement and the rest of the scene from <Video 1> unchanged.";

const MINIMAX_H3_DEFAULT_PROMPT_BY_VFX_MODE: Partial<
  Record<MiniMaxH3VfxMode, string>
> = {
  none: MINIMAX_H3_MULTIPURPOSE_DEFAULT_PROMPT,
  vfx_edit: MINIMAX_H3_VFX_EDIT_DEFAULT_PROMPT,
  head_swap: MINIMAX_H3_HEAD_SWAP_DEFAULT_PROMPT,
  character_swap: MINIMAX_H3_CHARACTER_SWAP_DEFAULT_PROMPT,
  style_transfer: MINIMAX_H3_STYLE_TRANSFER_DEFAULT_PROMPT
};

const promptUpdateForNewVfxMode = (
  key: string,
  value: unknown
): Partial<VideoSettings> | undefined => {
  if (key !== "vfx_mode") return undefined;
  return {
    prompt:
      MINIMAX_H3_DEFAULT_PROMPT_BY_VFX_MODE[resolveMiniMaxH3VfxMode(value)] ??
      ""
  };
};

export const minimaxH3LocalModel: VideoModelDefinition = {
  name: VideoEngine.minimax_h3_local,
  capabilities: {},
  displayName: "MiniMax H3 (Local)",
  onValueChange: promptUpdateForNewVfxMode,
  description:
    "Render MiniMax H3 on your own ComfyUI from your source video and reference images",
  type: "render",
  status: "active",
  category: ModelCategory.TRANSFORMATION_VFX,
  modeAvailability: {
    isRelaxedModeAvailable: false
  },
  disableDownload: ["frames", "video+frames"],
  extraKeys: {
    save_exr: false
  },
  calcEstimatedRenderTime: () => ({ impactToShow: 0 }),
  renderDurationLimits: {
    defaultFrameRange: {
      defaultRenderSeconds: 5,
      testRenderSeconds: 4
    },
    modelLimits: { minSeconds: 1, maxSeconds: 15 }
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
              key: "vfx_mode",
              type: "enum",
              label: "Choose your task",
              ui: "hidden",
              options: MINIMAX_H3_VFX_MODE_OPTIONS,
              defaultValue: "none",
              nullable: false,
              hidingCondition: () => true
            },
            {
              key: "source_image_slot",
              type: "string",
              label: "Edited frame",
              labelCaption:
                "Optional. A frame you edited, carried through the whole shot",
              tooltip:
                "Modify a frame of the source video, or upload one. Leave empty to describe the edit in the prompt alone.",
              ui: "FileUploaderWithStylizeButton",
              specificConfig: {
                sourceRoles: ["key_frame"],
                isPrimarySourceSlot: true,
                uploadButtonLabel: "Upload edited frame",
                uploadButtonSubtitle: "Format .jpg or .png"
              },
              defaultValue: undefined,
              nullable: true,
              hidingCondition: (settings) =>
                !isVfxModeSelected(settings, "vfx_edit")
            },
            {
              key: "prompt",
              type: "string",
              label: "Prompt (your video is always <Video 1>)",
              tooltip:
                "Describe your render. Refer to references as <Picture n> and <Video n>. Optimize prompt rewrites it with those tags, on local Qwen3.8 or on Mago cloud depending on the text model setting.",
              ui: "PromptWithAdaptI2vButton",
              defaultValue: MINIMAX_H3_MULTIPURPOSE_DEFAULT_PROMPT,
              nullable: false,
              errorMessage: "You need to add a prompt",
              specificConfig: {
                hideAutoPrompt: true,
                doubleHeight: true,
                adaptEngine: VideoEngine.minimax_reference
              }
            },
            {
              key: "image_ids",
              type: "array",
              label: "Reference (up to 9 images)",
              tooltip: "Character, scenery, style or atmosphere references",
              ui: "MultiImageTileUploader",
              specificConfig: {
                sourceRoles: ["reference_frame"],
                maxFileSizeBytes: IMAGE_UPLOAD_LIMITS.maxFileSizeBytes,
                minDimension: IMAGE_UPLOAD_LIMITS.minDimension,
                maxDimension: IMAGE_UPLOAD_LIMITS.maxDimension,
                errorKeyTooSmall: "upload_button_image_input_too_small",
                errorKeyTooBig: "upload_button_image_input_too_big",
                maxImageSlots: MINIMAX_H3_LOCAL_MAX_REFERENCE_IMAGES
              },
              defaultValue: [],
              nullable: true,
              customValidation: (_value, allValues, sources = []) =>
                doesVfxModeRequireReferenceImage(allValues) &&
                referenceFrameAssetIdsFromSources(sources).length === 0
                  ? "This VFX mode needs a reference image"
                  : null,
              hidingCondition: (settings) =>
                !doesVfxModeTakeReferenceImages(settings)
            }
          ]
        }
      ]
    },
    {
      name: "Quality",
      level: "quality",
      sections: [
        {
          name: undefined,
          settings: [
            {
              key: "h3_quality",
              type: "enum",
              label: "Quality",
              tooltip:
                "High uses the PDD 8-step accelerator. Medium uses the 4-step turbo LoRA and renders faster.",
              ui: "SelectInput",
              options: [
                { value: "high", label: "High — PDD 8 steps" },
                { value: "medium", label: "Medium — 4-step LoRA" }
              ],
              defaultValue: "high",
              nullable: false
            },
            {
              key: "resolution",
              type: "enum",
              label: "Resolution",
              tooltip:
                "Size of the shorter side of the output. Lower resolutions render faster, at the expense of quality. 1080p is experimental and intended for testing.",
              ui: "SelectInput",
              options: MINIMAX_H3_LOCAL_RESOLUTION_IDS.map((resolution) => ({
                value: resolution,
                label: resolution
              })),
              defaultValue: DEFAULT_RESOLUTION_ID,
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
              key: "use_video_audio",
              type: "boolean",
              label: "Use source audio",
              tooltip:
                "Carry the source video's own soundtrack into the render. Turn off to let the model invent a soundtrack instead.",
              ui: "CheckboxInput",
              defaultValue: true,
              nullable: false
            },
            {
              key: "vfx_lora_strength",
              type: "number",
              label: "VFX LoRA strength",
              tooltip:
                "How strongly the VFX LoRA applies. 1 is the author's recommended strength; 0 renders without it.",
              ui: "SliderAndNumberInput",
              min: MINIMAX_H3_VFX_LORA_STRENGTH_RANGE.min,
              max: MINIMAX_H3_VFX_LORA_STRENGTH_RANGE.max,
              step: 0.05,
              defaultValue: MINIMAX_H3_VFX_DEFAULT_LORA_STRENGTH,
              nullable: false,
              hidingCondition: (settings) => isVfxModeSelected(settings, "none")
            },
            {
              key: "aspect_ratio",
              type: "enum",
              label: "Aspect ratio",
              tooltip:
                "Shape of the output. References of mixed shapes are fitted to it.",
              ui: "SelectInput",
              options: SCRIPT_PROJECT_ASPECT_RATIOS.map((ratio) => ({
                value: ratio.id,
                label: ratio.id
              })),
              defaultValue: DEFAULT_ASPECT_RATIO_ID,
              nullable: false,
              hidingCondition: doesVfxModeKeepSourceShape
            },
            {
              key: "seed",
              type: "number",
              label: "Seed",
              tooltip:
                "Random number that will be the starting point of the generation. Try different values for slight variations.",
              ui: "NumberInputFullWidth",
              min: 0,
              max: 2 ** 32 - 1,
              step: 1,
              defaultValue: 42
            }
          ]
        }
      ]
    }
  ],
  formatValuesForBackend
};
