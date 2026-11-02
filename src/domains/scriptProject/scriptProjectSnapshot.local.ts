import { getLocalDesktopApi } from "@/platform/localDesktop";

import type {
  LocalScriptProjectSnapshot,
  LocalScriptProjectSnapshotInput
} from "../../../desktop/shared/contracts";

import { hydrateScriptMedia } from "./syncCloudScriptProjects.local";

// State, script versions and the cut can mount together. Share only their
// in-flight IPC read; the next refresh must still observe edits and run status.
const pendingReads = new WeakMap<
  object,
  Map<string, Promise<LocalScriptProjectSnapshot | null>>
>();

export const readScriptProjectSnapshot = (
  projectId: string
): Promise<LocalScriptProjectSnapshot | null> => {
  const snapshots = getLocalDesktopApi().scriptProjects;
  if (!snapshots) return Promise.resolve(null);
  let reads = pendingReads.get(snapshots);
  if (!reads) {
    reads = new Map();
    pendingReads.set(snapshots, reads);
  }
  const pending = reads.get(projectId);
  if (pending) return pending;
  const read = snapshots.get(projectId).finally(() => {
    if (reads.get(projectId) === read) reads.delete(projectId);
  });
  reads.set(projectId, read);
  return read;
};

export const writeScriptProjectSnapshot = async (
  input: LocalScriptProjectSnapshotInput
): Promise<void> => {
  const desktop = getLocalDesktopApi();
  const snapshots = desktop.scriptProjects;
  if (!snapshots) return;
  // A read already in flight belongs to the pre-write state.
  pendingReads.get(snapshots)?.delete(input.projectId);
  try {
    await snapshots.put(
      desktop.account.mode === "cloud"
        ? { ...input, metadataOnly: true }
        : input
    );
  } finally {
    pendingReads.get(snapshots)?.delete(input.projectId);
  }
  if (desktop.account.mode !== "cloud") return;
  // Read through the disk index before scheduling: cached files need neither
  // another transfer nor another completion event/refetch cycle.
  const cached = await snapshots.get(input.projectId);
  if (!cached) return;
  void hydrateScriptMedia(
    input.projectId,
    [cached.state, cached.scriptVersions, cached.planDetails, cached.cut],
    new AbortController().signal
  ).catch((error) =>
    console.warn("Failed to schedule script snapshot media", error)
  );
};
