import { stat } from "node:fs/promises";
import path from "node:path";

import type { NodePackDependenciesOutcome } from "../../shared/contracts";
import { asRecord } from "../comfy/asRecord";
import { ComfyClient } from "../comfy/ComfyClient";

import { findComfyPython } from "./findComfyPython";
import {
  describePipInstallCommand,
  installNodePackRequirements,
  requirementsFileOfNodePack
} from "./installNodePackRequirements";

const LOCAL_HOSTNAMES = ["localhost", "127.0.0.1", "[::1]"];
const PYTHON_PLACEHOLDER = "<ComfyUI Python>";

const isEndpointOnThisComputer = (endpoint: string) => {
  try {
    return LOCAL_HOSTNAMES.includes(new URL(endpoint).hostname);
  } catch {
    return false;
  }
};

const readReportedPythonVersion = async (endpoint: string) => {
  const systemStats = await new ComfyClient(endpoint)
    .getJson("/system_stats")
    .catch(() => null);
  const pythonVersion = asRecord(asRecord(systemStats)?.system)?.python_version;
  return typeof pythonVersion === "string" ? pythonVersion : null;
};

export const installManualNodePackDependencies = async ({
  nodePackDirectory,
  endpoint,
  signal
}: {
  nodePackDirectory: string;
  endpoint: string;
  signal?: AbortSignal;
}): Promise<NodePackDependenciesOutcome> => {
  const hasRequirementsFile = await stat(
    requirementsFileOfNodePack(nodePackDirectory)
  )
    .then((info) => info.isFile())
    .catch(() => false);
  if (!hasRequirementsFile) return { outcome: "no-requirements" };
  const comfyPython = isEndpointOnThisComputer(endpoint)
    ? await findComfyPython({
        comfyDirectory: path.dirname(path.dirname(nodePackDirectory)),
        reportedPythonVersion: await readReportedPythonVersion(endpoint)
      })
    : null;
  if (!comfyPython)
    return {
      outcome: "manual",
      pipCommand: describePipInstallCommand(
        PYTHON_PLACEHOLDER,
        nodePackDirectory
      )
    };
  try {
    return {
      outcome: await installNodePackRequirements({
        python: comfyPython,
        nodePackDirectory,
        signal
      })
    };
  } catch (error) {
    return {
      outcome: "manual",
      pipCommand: describePipInstallCommand(comfyPython, nodePackDirectory),
      failureReason: error instanceof Error ? error.message : String(error)
    };
  }
};
