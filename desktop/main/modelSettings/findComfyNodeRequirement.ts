import type { ScriptSetupRequirement } from "../../shared/contracts";
import { COMFYUI_REPOSITORY_URL } from "../localSetup/comfyRepositoryUrl";
import { evaluateScriptSetup } from "../localSetup/probeScriptSetup";
import { addSetupDestinations } from "../localSetup/setupDestinations";

let setupNodeCatalog: ScriptSetupRequirement[] | undefined;

const readSetupNodeCatalog = () => {
  if (setupNodeCatalog) return setupNodeCatalog;
  const setup = addSetupDestinations(evaluateScriptSetup({}), null, null);
  setupNodeCatalog = [
    ...setup.nodes,
    ...setup.highQuality,
    ...setup.optional.flatMap((group) => group.requirements)
  ].filter(
    (requirement) =>
      requirement.installKind === "node" || requirement.installKind === "core"
  );
  return setupNodeCatalog;
};

export const findComfyNodeRequirement = (
  comfyNodeName: string
): ScriptSetupRequirement => {
  const knownRequirement = readSetupNodeCatalog().find(
    (requirement) => requirement.name === comfyNodeName
  );
  if (knownRequirement) return { ...knownRequirement, status: "missing" };
  return {
    name: comfyNodeName,
    url: COMFYUI_REPOSITORY_URL,
    installKind: "core",
    status: "missing"
  };
};
