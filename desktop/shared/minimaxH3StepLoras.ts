import type { LocalModelGroupId } from "./localModelGroups";

export const MINIMAX_H3_DRAFT_STEPS = 2;
export const MINIMAX_H3_TURBO_STEPS = 4;
export const MINIMAX_H3_HD_STEPS = 8;

export const MINIMAX_H3_STEP_LORA_STEPS = [
  MINIMAX_H3_DRAFT_STEPS,
  MINIMAX_H3_TURBO_STEPS,
  MINIMAX_H3_HD_STEPS
] as const;

export type MiniMaxH3StepLoraSteps =
  (typeof MINIMAX_H3_STEP_LORA_STEPS)[number];

export type MiniMaxH3StepLora = {
  loraFile: string;
  loraFileSha256: string;
  modelGroupId: LocalModelGroupId;
};

export const MINIMAX_H3_STEP_LORAS: Record<
  MiniMaxH3StepLoraSteps,
  MiniMaxH3StepLora
> = {
  [MINIMAX_H3_DRAFT_STEPS]: {
    loraFile: "pika_h3_flex_turbo_2step_draft_ref2va.safetensors",
    loraFileSha256:
      "2b492374a8407afa95f3cdff92e8b8ccd1fff7139ac13ffd6a987d33cd81e341",
    modelGroupId: "minimax-h3-draft-lora"
  },
  [MINIMAX_H3_TURBO_STEPS]: {
    loraFile: "pika_h3_flex_turbo_4step_ref2va.safetensors",
    loraFileSha256:
      "7f4ddf47ab9966059d9d3f886603f00ee44c0e309e71edf585ac7cbc33af2ee5",
    modelGroupId: "minimax-h3-turbo-lora"
  },
  [MINIMAX_H3_HD_STEPS]: {
    loraFile: "pika_h3_flex_turbo_8step_hd_ref2va.safetensors",
    loraFileSha256:
      "dfe46d972408d1094053ff1f30c720bf16176ec334962009767ab0fff29e6de2",
    modelGroupId: "minimal"
  }
};

const LEGACY_THREE_STEP_PRESET = 3;

export const resolveMiniMaxH3StepLoraSteps = (
  value: unknown
): MiniMaxH3StepLoraSteps => {
  if (value === MINIMAX_H3_DRAFT_STEPS || value === LEGACY_THREE_STEP_PRESET)
    return MINIMAX_H3_DRAFT_STEPS;
  if (value === MINIMAX_H3_TURBO_STEPS) return MINIMAX_H3_TURBO_STEPS;
  return MINIMAX_H3_HD_STEPS;
};

export const MINIMAX_H3_QUALITIES = ["hd", "turbo", "draft"] as const;

export type MiniMaxH3Quality = (typeof MINIMAX_H3_QUALITIES)[number];

const LEGACY_MEDIUM_QUALITY = "medium";

export const resolveMiniMaxH3QualitySteps = (
  value: unknown
): MiniMaxH3StepLoraSteps => {
  if (value === "draft") return MINIMAX_H3_DRAFT_STEPS;
  if (value === "turbo" || value === LEGACY_MEDIUM_QUALITY)
    return MINIMAX_H3_TURBO_STEPS;
  return MINIMAX_H3_HD_STEPS;
};
