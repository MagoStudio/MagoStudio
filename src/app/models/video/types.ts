import { SourceImage, SourceImageType } from "@domains/renders/types";
import { SettingsGroup } from "@models/shared/types";

export enum ModelCategory {
  TRANSFORMATION_VFX = "transformation_vfx",
  STYLIZATION = "stylization",
  CHARACTER_REPLACEMENT = "character_replacement",
  UPSCALE = "upscale",
  PRIVATE = "private"
}

export const MODEL_CATEGORY_ORDER: ModelCategory[] = [
  ModelCategory.TRANSFORMATION_VFX,
  ModelCategory.STYLIZATION,
  ModelCategory.CHARACTER_REPLACEMENT,
  ModelCategory.UPSCALE,
  ModelCategory.PRIVATE
];

export enum VideoEngine {
  V2_5_0 = "v2.5.0",
  V3_1_0 = "v3.1.0",
  V3_2_0 = "v3.2.0",
  V3_3_0 = "v3.3.0",
  V3_3_0_CNETS = "v3.3.0.cnets",
  V3_4_0 = "v3.4.0",
  V4_0_0 = "v4.0.0",
  V5_0_0 = "v5.0.0",
  V4_1_0 = "v4.1.0",
  v1_0_0_upscaler = "v1.0_upscaler",
  v2_0_0_esrgan_upscaler = "v2.0.0_esrgan_upscaler",
  kling_o1 = "kling_o1",
  kling_2_6_motion_control = "kling_2_6_motion_control",
  kling_3_motion_control = "kling_3_motion_control",
  kling_o3_edit_pro = "kling_o3_edit_pro",
  v1_0_0_mask = "v1.0.0.mask",
  V5_1_0 = "v5.1.0",
  seedance_2 = "seedance_2",
  seedance_2_5 = "seedance_2_5",
  seedance_2_i2v = "seedance_2_i2v",
  seedance_2_i2v_fast = "seedance_2_i2v_fast",
  happy_horse_1 = "happy_horse_1",
  V7_0_0 = "v7.0.0",
  V8_0_0 = "v8.0.0",
  minimax_reference = "v9.1.0"
}

export const VIDEO_ONLY_ENGINES = new Set<VideoEngine>([
  VideoEngine.V7_0_0,
  VideoEngine.V8_0_0,
  VideoEngine.v1_0_0_upscaler,
  VideoEngine.v2_0_0_esrgan_upscaler
]);

export const QUALITY_RETRY_UNSUPPORTED_ENGINES = new Set<VideoEngine>([
  VideoEngine.V7_0_0,
  VideoEngine.v1_0_0_upscaler,
  VideoEngine.v2_0_0_esrgan_upscaler
]);

export const IMAGE_SEQUENCE_EXPORT = {
  PNG: "png",
  EXR_16BIT: "exr_16bit"
} as const;

export type ElementPair = {
  reference_image_id: string[];
  frontal_image_id?: string;
};

export interface VideoSettings {
  [key: string]:
    | string
    | number
    | boolean
    | undefined
    | [number, number]
    | string[]
    | [ElementPair]
    | Array<{ lora_name: string; lora_strength: number }>
    | Array<{ x: number; y: number }>;
}

interface MagovRenderTimes {
  impactToShow: number;
}

export type CalcEstimatedRenderTimeFunction = (
  renderSettings: VideoSettings,
  frameRangeLength: number,
  skipCnCount?: boolean
) => MagovRenderTimes;

export interface FrameBasedEffectiveLimits {
  minFrames: number;
  maxFrames: number;
  minSeconds?: undefined;
  maxSeconds?: undefined;
}

export interface TimeBasedEffectiveLimits {
  minSeconds: number;
  maxSeconds: number;
  minFrames?: undefined;
  maxFrames?: undefined;
}

export type EffectiveDurationLimits =
  | FrameBasedEffectiveLimits
  | TimeBasedEffectiveLimits;

export const isTimeBasedDurationLimits = (
  limits: EffectiveDurationLimits | ModelLimits
): limits is TimeBasedEffectiveLimits => {
  return "minSeconds" in limits && limits.minSeconds !== undefined;
};

export interface FrameBasedModelLimits {
  minFrames: number;
  maxFrames: number;
  interpolationMinFrames?: number;
  interpolationMaxFrames?: number;
  minSeconds?: undefined;
  maxSeconds?: undefined;
}

export interface TimeBasedModelLimits {
  minSeconds: number;
  maxSeconds: number;
  minFrames?: undefined;
  maxFrames?: undefined;
  interpolationMinFrames?: undefined;
  interpolationMaxFrames?: undefined;
}

export type ModelLimits = FrameBasedModelLimits | TimeBasedModelLimits;

export const isFrameBasedModelLimits = (
  limits: ModelLimits
): limits is FrameBasedModelLimits => {
  return "minFrames" in limits && limits.minFrames !== undefined;
};

interface FrameBasedDefaultRange {
  defaultRender: number;
  testRender: number;
  defaultRenderSeconds?: undefined;
  testRenderSeconds?: undefined;
}

interface TimeBasedDefaultRange {
  defaultRenderSeconds: number;
  testRenderSeconds: number;
  defaultRender?: undefined;
  testRender?: undefined;
}

export type DefaultRangeType = FrameBasedDefaultRange | TimeBasedDefaultRange;

const isTimeBasedDefaultRange = (
  range: DefaultRangeType
): range is TimeBasedDefaultRange => {
  return (
    "defaultRenderSeconds" in range && range.defaultRenderSeconds !== undefined
  );
};

export const getDefaultRenderFrames = (
  defaultFrameRange: DefaultRangeType,
  fps: number
): number => {
  if (isTimeBasedDefaultRange(defaultFrameRange)) {
    return Math.floor(defaultFrameRange.defaultRenderSeconds * fps);
  }
  return defaultFrameRange.defaultRender;
};

export interface RenderDurationLimits {
  defaultFrameRange: DefaultRangeType;
  modelLimits: ModelLimits;
}

export interface ComputedRenderLimits {
  minFrames: number;
  maxFrames: number;
  modelHasTimeBasedDurationLimits: boolean;
  minSeconds?: number;
  maxSeconds?: number;
}

export interface PrepareRenderSettingsContext {
  inputVideoWidth?: number;
  inputVideoHeight?: number;
  frameRange: number[];
  fps: number;
  sources: SourceImage[];
}

export interface ValidationContext {
  fps: number;
  isUnlimitedModeActive: boolean;
  inputVideoWidth?: number;
  inputVideoHeight?: number;
  imageDimensions?: Array<{ width: number; height: number }>;
}

export interface ContextValidationResult {
  isRenderContextValid: boolean;
  errorKey?: string;
}

interface ModeAvailability {
  isRelaxedModeAvailable?: boolean;
}

interface VideoModelCapabilities {
  wireSourceRoles?: SourceImageType[];
  supportsFacemeshBlending?: boolean;
  supportsBulkRendering?: boolean;
  overwritesPromptOnSelect?: boolean;
  supportsVideoReferenceToggle?: boolean;
}

export interface VideoModelDefinition {
  name: VideoEngine;
  displayName: string;
  displayNameDetails?: string;
  description: string;
  type: string;
  status: "active" | "deprecated" | "team_only" | "hidden";
  settingsGroups: Array<SettingsGroup>;
  calcEstimatedRenderTime: CalcEstimatedRenderTimeFunction;
  renderDurationLimits: RenderDurationLimits;
  isSourceImageRequired?: boolean;
  isWanModel?: boolean;
  capabilities: VideoModelCapabilities;
  extraKeys?: {
    [key: string]: string | number | boolean | undefined | [number, number];
  };
  onDuplicate?: (settings: VideoSettings) => VideoSettings;
  formatValuesForBackend?: (
    settings: VideoSettings,
    context: PrepareRenderSettingsContext
  ) => VideoSettings;
  formatSourcesForBackend?: (
    settings: VideoSettings,
    context: PrepareRenderSettingsContext
  ) => SourceImage[];
  validateContext?: (context: ValidationContext) => ContextValidationResult;
  category?: ModelCategory;
  modeAvailability?: ModeAvailability;
  disableDownload?: Array<"video" | "frames" | "video+frames">;
  onValueChange?: (
    key: string,
    value: unknown,
    currentValues: VideoSettings
  ) => Partial<VideoSettings> | undefined;
  formatValuesForFrontend?: (values: VideoSettings) => VideoSettings;
}

export interface Magov2Diffs {
  total: number;
  sizeDiff: number;
  stepsDiff: number;
  cnDiff: number;
  ctxDiff: number;
  denoiseDiff: number;
}
