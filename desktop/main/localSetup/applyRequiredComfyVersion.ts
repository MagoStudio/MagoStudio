import type {
  ScriptSetupRequirement,
  ScriptSetupStatus
} from "../../shared/contracts";
import { asRecord } from "../comfy/asRecord";

const COMFYUI_REPOSITORY_URL = "https://github.com/Comfy-Org/ComfyUI";

const parseVersion = (version: string): number[] | null => {
  const match = /^v?(\d+)\.(\d+)\.(\d+)/.exec(version.trim());
  return match ? match.slice(1).map(Number) : null;
};

const isVersionAtLeast = (reported: number[], required: number[]) => {
  for (let index = 0; index < required.length; index++) {
    if (reported[index] !== required[index])
      return reported[index] > required[index];
  }
  return true;
};

export const applyRequiredComfyVersion = (
  status: ScriptSetupStatus,
  systemStats: unknown,
  requiredComfyVersion: string
): ScriptSetupStatus => {
  const required = parseVersion(requiredComfyVersion);
  if (!required) return status;
  const reportedVersion = asRecord(
    asRecord(systemStats)?.system
  )?.comfyui_version;
  const reported =
    typeof reportedVersion === "string" ? parseVersion(reportedVersion) : null;
  const versionStatus: ScriptSetupRequirement["status"] = !reported
    ? "unknown"
    : isVersionAtLeast(reported, required)
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
