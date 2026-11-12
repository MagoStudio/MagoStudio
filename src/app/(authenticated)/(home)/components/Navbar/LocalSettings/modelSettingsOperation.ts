import type { ModelOperationResult } from "../../../../../../../desktop/shared/modelSettings";

export type ModelSettingsOperationSlot =
  | "variant"
  | "useFile"
  | "testCandidate"
  | "restore"
  | "hash"
  | "testLoad"
  | "saveLoad"
  | "runtime"
  | "repair";

export type ModelSettingsOperation = {
  slot: ModelSettingsOperationSlot;
  outcome: ModelOperationResult[] | "running";
};
