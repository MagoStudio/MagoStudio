import path from "node:path";

import type { BrowserWindow } from "electron";

import type {
  ComfySettings,
  SetupRequirementDownloadResult
} from "../../shared/contracts";

import { chooseSetupRequirementFolder } from "./chooseSetupRequirementFolder";
import { downloadSetupRequirementIntoFolder } from "./downloadSetupRequirementIntoFolder";
import { installManualNodePackDependencies } from "./installManualNodePackDependencies";
import { NodePackAlreadyInstalledError } from "./NodePackAlreadyInstalledError";
import { resolveNodePackBackupsFolder } from "./resolveNodePackBackupsFolder";
import { resolveSetupRequirements } from "./resolveSetupRequirements";

export const downloadSetupRequirement = async (
  window: BrowserWindow,
  settings: ComfySettings,
  name: string,
  signal?: AbortSignal,
  {
    replaceExistingNodePackIn,
    onProgress,
    onDestination
  }: {
    replaceExistingNodePackIn?: string;
    onProgress?: (downloadedBytes: number, totalBytes: number | null) => void;
    onDestination?: (destination: string) => void;
  } = {}
): Promise<SetupRequirementDownloadResult | null> => {
  const [requirement] = await resolveSetupRequirements(settings, [name]);
  const isReplacingNodePack = replaceExistingNodePackIn !== undefined;
  if (
    isReplacingNodePack &&
    (requirement.installKind !== "node" ||
      !path.isAbsolute(replaceExistingNodePackIn))
  )
    throw new Error("Only an installed node pack can be updated in place.");
  const folder =
    replaceExistingNodePackIn ??
    (await chooseSetupRequirementFolder(window, settings, requirement));
  if (!folder) return null;
  let savedTo: string;
  try {
    savedTo = await downloadSetupRequirementIntoFolder(
      requirement,
      folder,
      signal,
      {
        replaceExistingNodePack: isReplacingNodePack,
        onProgress,
        onDestination
      }
    );
  } catch (error) {
    if (!(error instanceof NodePackAlreadyInstalledError)) throw error;
    return {
      outcome: "node-pack-update-needs-confirmation",
      customNodesFolder: folder,
      nodePackDirectory: error.nodePackDirectory,
      backupsFolder: resolveNodePackBackupsFolder(folder)
    };
  }
  if (requirement.installKind !== "node") return { outcome: "saved", savedTo };
  return {
    outcome: "saved",
    savedTo,
    nodePackDependencies: await installManualNodePackDependencies({
      nodePackDirectory: savedTo,
      endpoint: settings.endpoint,
      signal
    })
  };
};
