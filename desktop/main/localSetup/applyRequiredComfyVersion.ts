import type {
  ScriptSetupRequirement,
  ScriptSetupStatus
} from "../../shared/contracts";
import { isComfyVersionAtLeast } from "../../shared/isComfyVersionAtLeast";
import { asRecord } from "../comfy/asRecord";

import { COMFYUI_REPOSITORY_URL } from "./comfyRepositoryUrl";

export const applyRequiredComfyVersion = (
  status: ScriptSetupStatus,
  systemStats: unknown,
  requiredComfyVersion: string
): ScriptSetupStatus => {
  const isMinimumComfyVersionRequired = requiredComfyVersion.trim() !== "";
  if (!isMinimumComfyVersionRequired) return status;
  const reportedVersion = asRecord(
    asRecord(systemStats)?.system
  )?.comfyui_version;
  const isReportedVersionSufficient =
    typeof reportedVersion === "string"
      ? isComfyVersionAtLeast(reportedVersion, requiredComfyVersion)
      : null;
  const versionStatus: ScriptSetupRequirement["status"] =
    isReportedVersionSufficient === null
      ? "unknown"
      : isReportedVersionSufficient
        ? "installed"
        : "missing";
  const versionRequirement: ScriptSetupRequirement = {
    name: `ComfyUI ${requiredComfyVersion} or later`,
    url: COMFYUI_REPOSITORY_URL,
    installKind: "core",
    status: versionStatus
  };
  return {
    ...status,
    ready: status.ready && versionStatus !== "missing",
    nodes: [versionRequirement, ...status.nodes]
  };
};
