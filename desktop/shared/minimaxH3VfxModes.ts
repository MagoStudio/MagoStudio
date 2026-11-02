export const MINIMAX_H3_VFX_MODES = [
  "none",
  "vfx_edit",
  "head_swap",
  "character_swap",
  "style_transfer"
] as const;

export type MiniMaxH3VfxMode = (typeof MINIMAX_H3_VFX_MODES)[number];

export type MiniMaxH3VfxSourceClipPlacement = "guide" | "reference";

export type MiniMaxH3VfxReferenceImageRule = "none" | "optional" | "required";

export interface MiniMaxH3VfxLora {
  loraFile: string;
  trigger?: string;
  sourceClipPlacement: MiniMaxH3VfxSourceClipPlacement;
  referenceImageRule: MiniMaxH3VfxReferenceImageRule;
}

export const MINIMAX_H3_VFX_LORA_STRENGTH_RANGE = { min: -2, max: 2 } as const;

export const MINIMAX_H3_VFX_DEFAULT_LORA_STRENGTH = 1;

const VFX_EDIT_LORA: MiniMaxH3VfxLora = {
  loraFile: "minimax_h3_vfx_edit_v1.0_r128.safetensors",
  trigger: "vfx_edit:",
  sourceClipPlacement: "guide",
  referenceImageRule: "none"
};

const VFX_EDIT_FROM_EDITED_FRAME_LORA: MiniMaxH3VfxLora = {
  loraFile: "minimax_h3_vfx_edit_v1.0_r128_ffp.safetensors",
  trigger: "vfx_edit:",
  sourceClipPlacement: "guide",
  referenceImageRule: "required"
};

const MINIMAX_H3_VFX_LORAS: Record<
  Exclude<MiniMaxH3VfxMode, "none" | "vfx_edit">,
  MiniMaxH3VfxLora
> = {
  head_swap: {
    loraFile: "minimax_h3_head_swap_v1.0_r32.safetensors",
    trigger: "head_swap:",
    sourceClipPlacement: "guide",
    referenceImageRule: "required"
  },
  character_swap: {
    loraFile: "h3_character_swap_pro4500_1000.safetensors",
    sourceClipPlacement: "reference",
    referenceImageRule: "required"
  },
  style_transfer: {
    loraFile: "minimax_h3_style_transfer_v1.0_r64.safetensors",
    trigger: "style_transfer:",
    sourceClipPlacement: "guide",
    referenceImageRule: "optional"
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

export const doesMiniMaxH3VfxModeKeepSourceShape = (
  mode: MiniMaxH3VfxMode
): boolean =>
  resolveMiniMaxH3VfxLora(mode, false)?.sourceClipPlacement === "guide";

export const resolveMiniMaxH3VfxLoraStrength = (
  settings: Record<string, unknown>
): number =>
  typeof settings.vfx_lora_strength === "number" &&
  Number.isFinite(settings.vfx_lora_strength)
    ? Math.min(
        MINIMAX_H3_VFX_LORA_STRENGTH_RANGE.max,
        Math.max(
          MINIMAX_H3_VFX_LORA_STRENGTH_RANGE.min,
          settings.vfx_lora_strength
        )
      )
    : MINIMAX_H3_VFX_DEFAULT_LORA_STRENGTH;

export const isMiniMaxH3VfxEditedFrameProvided = (
  settings: Record<string, unknown>
): boolean =>
  typeof settings.vfx_edited_frame_id === "string" &&
  settings.vfx_edited_frame_id.length > 0;
