import { PlanStatus, StepStatus } from "@schemas/plan";

export type PlanGlyphColor =
  | "glyph-primary"
  | "glyph-secondary"
  | "glyph-success"
  | "glyph-warning"
  | "glyph-error";

export const ACTIVE_PLAN_STATUSES = new Set<PlanStatus>([
  "PENDING",
  "RUNNING",
  "PAUSED"
]);

export const CANCELLABLE_PLAN_STATUSES = new Set<PlanStatus>([
  "PENDING",
  "RUNNING",
  "PAUSED"
]);

export const HIDDEN_FROM_ALL_TAB = new Set<PlanStatus>(["CANCELLED"]);

export const TERMINAL_STEP_STATUSES = new Set<StepStatus>([
  "COMPLETED",
  "SKIPPED"
]);

export const PLAN_STATUS_COLOR_MAP: Record<PlanStatus, PlanGlyphColor> = {
  PENDING: "glyph-secondary",
  RUNNING: "glyph-primary",
  PAUSED: "glyph-warning",
  COMPLETED: "glyph-success",
  FAILED: "glyph-error",
  CANCELLED: "glyph-secondary"
};

export const STEP_STATUS_COLOR_MAP: Record<StepStatus, PlanGlyphColor> = {
  PENDING: "glyph-secondary",
  RUNNING: "glyph-primary",
  COMPLETED: "glyph-success",
  FAILED: "glyph-error",
  SKIPPED: "glyph-secondary"
};
