export const MINIMAX_H3_VFX_MODES = [
  "none",
  "vfx_edit",
  "head_swap",
  "character_swap",
  "style_transfer",
  "crossview"
] as const;

export type MiniMaxH3VfxMode = (typeof MINIMAX_H3_VFX_MODES)[number];

export type MiniMaxH3VfxSourceClipPlacement = "guide" | "reference" | "warp";

export type MiniMaxH3VfxReferenceImageRule = "none" | "optional" | "required";

export type MiniMaxH3VfxSourceAudioRule = "none" | "optional";

export interface MiniMaxH3VfxLora {
  loraFile: string;
  trigger?: string;
  fixedPrompt?: string;
  sourceClipPlacement: MiniMaxH3VfxSourceClipPlacement;
  referenceImageRule: MiniMaxH3VfxReferenceImageRule;
  sourceAudioRule: MiniMaxH3VfxSourceAudioRule;
}

export const MINIMAX_H3_VFX_LORA_STRENGTH_RANGE = { min: -2, max: 2 } as const;

export const MINIMAX_H3_VFX_DEFAULT_LORA_STRENGTH = 1;

export const MINIMAX_H3_CROSSVIEW_LORA_FILE =
  "MiniMax-H3_Ref2VA-LoRA-CrossView-Warp_v1_3500.safetensors";

export const MINIMAX_H3_CROSSVIEW_DEFAULT_LORA_STRENGTH = 0.8;

export const MINIMAX_H3_CROSSVIEW_AZIMUTH_RANGE = {
  min: -90,
  max: 90
} as const;

export const MINIMAX_H3_CROSSVIEW_ELEVATION_RANGE = {
  min: -45,
  max: 45
} as const;

export const MINIMAX_H3_CROSSVIEW_DEFAULT_AZIMUTH_DEGREES = 30;

export const MINIMAX_H3_CROSSVIEW_DEFAULT_ELEVATION_DEGREES = 0;

export interface MiniMaxH3CrossviewCamera {
  azimuthDegrees: number;
  elevationDegrees: number;
}

const VFX_EDIT_LORA: MiniMaxH3VfxLora = {
  loraFile: "minimax_h3_vfx_edit_v1.0_r128.safetensors",
  trigger: "vfx_edit:",
  sourceClipPlacement: "guide",
  referenceImageRule: "none",
  sourceAudioRule: "optional"
};

const VFX_EDIT_FROM_EDITED_FRAME_LORA: MiniMaxH3VfxLora = {
  loraFile: "minimax_h3_vfx_edit_v1.0_r128_ffp.safetensors",
  trigger: "vfx_edit:",
  sourceClipPlacement: "guide",
  referenceImageRule: "required",
  sourceAudioRule: "optional"
};

const MINIMAX_H3_VFX_LORAS: Record<
  Exclude<MiniMaxH3VfxMode, "none" | "vfx_edit">,
  MiniMaxH3VfxLora
> = {
  head_swap: {
    loraFile: "minimax_h3_head_swap_v1.0_r32.safetensors",
    trigger: "head_swap:",
    sourceClipPlacement: "guide",
    referenceImageRule: "required",
    sourceAudioRule: "optional"
  },
  character_swap: {
    loraFile: "h3_character_swap_pro4500_1000.safetensors",
    sourceClipPlacement: "reference",
    referenceImageRule: "required",
    sourceAudioRule: "optional"
  },
  style_transfer: {
    loraFile: "minimax_h3_style_transfer_v1.0_r64.safetensors",
    trigger: "style_transfer:",
    sourceClipPlacement: "guide",
    referenceImageRule: "optional",
    sourceAudioRule: "optional"
  },
  crossview: {
    loraFile: MINIMAX_H3_CROSSVIEW_LORA_FILE,
    fixedPrompt: "crossview",
    sourceClipPlacement: "warp",
    referenceImageRule: "none",
    sourceAudioRule: "none"
  }
};

export const resolveMiniMaxH3VfxMode = (value: unknown): MiniMaxH3VfxMode =>
  MINIMAX_H3_VFX_MODES.find((mode) => mode === value) ?? "none";

export const resolveMiniMaxH3VfxLora = (
  mode: MiniMaxH3VfxMode,
  isEditedFrameProvided: boolean
): MiniMaxH3VfxLora | undefined => {
  if (mode === "none") return undefined;
  if (mode === "vfx_edit")
    return isEditedFrameProvided
      ? VFX_EDIT_FROM_EDITED_FRAME_LORA
      : VFX_EDIT_LORA;
  return MINIMAX_H3_VFX_LORAS[mode];
};

export const doesMiniMaxH3VfxModeTakeSourceAudio = (
  mode: MiniMaxH3VfxMode
): boolean => resolveMiniMaxH3VfxLora(mode, false)?.sourceAudioRule !== "none";

export const doesMiniMaxH3VfxModeKeepSourceShape = (
  mode: MiniMaxH3VfxMode
): boolean => {
  const sourceClipPlacement = resolveMiniMaxH3VfxLora(
    mode,
    false
  )?.sourceClipPlacement;
  return sourceClipPlacement === "guide" || sourceClipPlacement === "warp";
};

const clampToRange = (
  value: unknown,
  range: { min: number; max: number },
  fallback: number
): number =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.min(range.max, Math.max(range.min, value))
    : fallback;

export const resolveMiniMaxH3VfxLoraStrength = (
  settings: Record<string, unknown>
): number =>
  resolveMiniMaxH3VfxMode(settings.vfx_mode) === "crossview"
    ? clampToRange(
        settings.crossview_lora_strength,
        MINIMAX_H3_VFX_LORA_STRENGTH_RANGE,
        MINIMAX_H3_CROSSVIEW_DEFAULT_LORA_STRENGTH
      )
    : clampToRange(
        settings.vfx_lora_strength,
        MINIMAX_H3_VFX_LORA_STRENGTH_RANGE,
        MINIMAX_H3_VFX_DEFAULT_LORA_STRENGTH
      );

export const resolveMiniMaxH3CrossviewCamera = (
  settings: Record<string, unknown>
): MiniMaxH3CrossviewCamera => ({
  azimuthDegrees: clampToRange(
    settings.crossview_azimuth,
    MINIMAX_H3_CROSSVIEW_AZIMUTH_RANGE,
    MINIMAX_H3_CROSSVIEW_DEFAULT_AZIMUTH_DEGREES
  ),
  elevationDegrees: clampToRange(
    settings.crossview_elevation,
    MINIMAX_H3_CROSSVIEW_ELEVATION_RANGE,
    MINIMAX_H3_CROSSVIEW_DEFAULT_ELEVATION_DEGREES
  )
});

export const isMiniMaxH3VfxEditedFrameProvided = (
  settings: Record<string, unknown>
): boolean =>
  typeof settings.vfx_edited_frame_id === "string" &&
  settings.vfx_edited_frame_id.length > 0;
