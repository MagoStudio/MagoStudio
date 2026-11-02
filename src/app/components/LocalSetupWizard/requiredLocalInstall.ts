import type { LocalModelGroupId } from "../../../../desktop/shared/localModelGroups";

export type RequiredLocalInstall =
  | { kind: "model-group"; modelGroupId: LocalModelGroupId }
  | { kind: "manual-download" };
