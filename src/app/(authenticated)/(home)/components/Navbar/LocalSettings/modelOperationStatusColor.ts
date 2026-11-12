import type { ModelOperationResult } from "../../../../../../../desktop/shared/modelSettings";

export const modelOperationStatusColor = {
  success: "glyph-success",
  error: "glyph-error",
  mismatch: "glyph-error",
  unsupported: "glyph-warning",
  unknown: "glyph-warning"
} as const satisfies Record<ModelOperationResult["status"], string>;
