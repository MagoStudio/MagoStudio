import { describe, expect, it } from "vitest";

import { LOCAL_MODEL_DEFINITIONS } from "../../shared/localModelDefinitions";

import { listModelTypeWorkflowNodes } from "./listModelTypeWorkflowNodes";

describe("listModelTypeWorkflowNodes", () => {
  it("lists the text workflow nodes besides the Qwen loader", () => {
    expect(listModelTypeWorkflowNodes("text")).toEqual([
      "PrimitiveStringMultiline",
      "PreviewAny"
    ]);
  });

  it.each([
    ["minimax", "MiniMaxH3SigmaShift"],
    ["qwen-image", "ModelSamplingAuraFlow"],
    ["qwen-edit", "TextEncodeQwenImageEditPlus"],
    ["flux", "Flux2Scheduler"]
  ] as const)("lists the %s sampling node %s", (model, nodeName) => {
    expect(listModelTypeWorkflowNodes(model)).toContain(nodeName);
  });

  it.each(LOCAL_MODEL_DEFINITIONS.map((definition) => definition))(
    "leaves the loaders of $id to the per-file check",
    (definition) => {
      const loaders = definition.variants.flatMap((variant) =>
        variant.components.map((component) => component.loader)
      );
      for (const nodeName of listModelTypeWorkflowNodes(definition.id))
        expect(loaders).not.toContain(nodeName);
    }
  );
});
