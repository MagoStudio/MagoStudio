import { stat } from "node:fs/promises";
import path from "node:path";

import type { BrowserWindow } from "electron";

import type { ComfySettings } from "../../shared/contracts";

import { chooseSetupRequirementFolder } from "./chooseSetupRequirementFolder";
import { downloadSetupRequirementIntoFolder } from "./downloadSetupRequirementIntoFolder";
import { resolveSetupRequirements } from "./resolveSetupRequirements";

const isFinishedFileInFolder = async (folder: string, name: string) =>
  (await stat(path.join(folder, name)).catch(() => null))?.isFile() ?? false;

export const downloadSetupRequirements = async (
  window: BrowserWindow,
  settings: ComfySettings,
  names: string[],
  signal?: AbortSignal
): Promise<string | null> => {
  const requirements = await resolveSetupRequirements(settings, names);
  const [firstRequirement] = requirements;
  if (!firstRequirement) return null;
  const chosenFolder = await chooseSetupRequirementFolder(
    window,
    settings,
    firstRequirement
  );
  if (!chosenFolder) return null;
  for (const requirement of requirements) {
    signal?.throwIfAborted();
    if (await isFinishedFileInFolder(chosenFolder, requirement.name)) continue;
    try {
      await downloadSetupRequirementIntoFolder(
        requirement,
        chosenFolder,
        signal
      );
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`${requirement.name}: ${reason}`);
    }
  }
  return chosenFolder;
};
