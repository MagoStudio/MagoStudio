import type {
  OptionalScriptSetupId,
  ScriptSetupRequirement
} from "../../shared/contracts";
import { LOCAL_MODEL_DEFINITIONS } from "../../shared/localModelDefinitions";
import type { LocalModelType } from "../../shared/modelSettings";
import { listComfyRenderModelNodes } from "../imageRenders/comfyModelValidation";
import { optionalScriptSetups } from "../localSetup/optionalScriptSetups";
import { evaluateScriptSetup } from "../localSetup/probeScriptSetup";

const nodesOfSetupGroup = (setupGroupId: OptionalScriptSetupId) =>
  optionalScriptSetups({
    vlmBackend: "qwen3-vl-2b-gguf",
    scriptTextModel: "qwen38-27b-q5"
  }).find((setupGroup) => setupGroup.id === setupGroupId)?.nodes ?? [];

const nodeNames = (requirements: ScriptSetupRequirement[]) =>
  requirements.map((requirement) => requirement.name);

const listNodesOfWorkflowsUsingModelType = (
  model: LocalModelType
): string[] => {
  switch (model) {
    case "text":
      return nodesOfSetupGroup("script-text");
    case "minimax":
      return nodeNames(evaluateScriptSetup({}).nodes);
    case "qwen-image":
      return nodesOfSetupGroup("qwen-image-sheet");
    case "qwen-edit":
      return listComfyRenderModelNodes("qwen");
    case "flux":
      return nodesOfSetupGroup("flux-klein-4b-sheet");
  }
};

export const listModelTypeWorkflowNodes = (model: LocalModelType): string[] => {
  const loadersCheckedPerModelFile = new Set(
    LOCAL_MODEL_DEFINITIONS.find(
      (definition) => definition.id === model
    )?.variants.flatMap((variant) =>
      variant.components.map((component) => component.loader)
    ) ?? []
  );
  return [...new Set(listNodesOfWorkflowsUsingModelType(model))].filter(
    (nodeName) => !loadersCheckedPerModelFile.has(nodeName)
  );
};
