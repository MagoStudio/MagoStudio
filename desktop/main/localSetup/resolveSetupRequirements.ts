import type {
  ComfySettings,
  ScriptSetupRequirement
} from "../../shared/contracts";

import { evaluateScriptSetup } from "./probeScriptSetup";
import { addSetupDestinations } from "./setupDestinations";

const PATH_TIMEOUT_MS = 5000;

export type DownloadableSetupRequirement = ScriptSetupRequirement & {
  downloadUrl: string;
};

export const resolveSetupRequirements = async (
  settings: ComfySettings,
  names: string[]
): Promise<DownloadableSetupRequirement[]> => {
  const endpoint = settings.endpoint.replace(/\/$/, "");
  const read = async (route: string) => {
    try {
      const response = await fetch(`${endpoint}${route}`, {
        signal: AbortSignal.timeout(PATH_TIMEOUT_MS)
      });
      return response.ok ? await response.json() : null;
    } catch {
      return null;
    }
  };
  const [stats, inventory] = await Promise.all([
    read("/system_stats"),
    read("/experiment/models")
  ]);
  // Resolve URLs from our own catalog; the renderer only supplies a name.
  const setup = addSetupDestinations(
    evaluateScriptSetup({}, settings),
    stats,
    inventory
  );
  const knownRequirements = [
    ...setup.nodes,
    ...setup.models,
    ...setup.optionalStepLoras,
    ...setup.vfxLoras,
    ...setup.optional.flatMap((group) => group.requirements)
  ];
  return names.map((name) => {
    const requirement = knownRequirements.find((item) => item.name === name);
    if (!requirement?.downloadUrl)
      throw new Error(
        "This requirement must be installed by updating ComfyUI."
      );
    return { ...requirement, downloadUrl: requirement.downloadUrl };
  });
};
