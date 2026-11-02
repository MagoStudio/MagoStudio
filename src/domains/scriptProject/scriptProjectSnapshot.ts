import type {
  LocalScriptProjectSnapshot,
  LocalScriptProjectSnapshotInput
} from "../../../desktop/shared/contracts";

export const readScriptProjectSnapshot = async (
  _projectId: string
): Promise<LocalScriptProjectSnapshot | null> => null;

export const writeScriptProjectSnapshot = async (
  _input: LocalScriptProjectSnapshotInput
): Promise<void> => {};
