import type { ComfyGraph } from "../comfy/comfyGraph";

import { prepareModelGraph } from "./modelRuntimeHooks";

export const prepareModelRequirements = async (
  endpoint: string,
  requirements: {
    nodes: string[];
    files: Array<{ node: string; input: string; filename: string }>;
  }
) => {
  const graph: ComfyGraph = Object.fromEntries([
    ...requirements.files.map((file, index) => [
      `file-${index}`,
      { class_type: file.node, inputs: { [file.input]: file.filename } }
    ]),
    ...requirements.nodes.map((node, index) => [
      `node-${index}`,
      { class_type: node, inputs: {} }
    ])
  ]);
  const prepared = await prepareModelGraph(endpoint, graph);
  const files = requirements.files.map((file, index) => ({
    ...file,
    node: prepared[`file-${index}`].class_type,
    filename: String(prepared[`file-${index}`].inputs[file.input])
  }));
  const replacements = new Map(
    requirements.files.map((file, index) => [file.node, files[index].node])
  );
  return {
    files,
    nodes: [
      ...new Set(
        requirements.nodes.map(
          (node, index) =>
            replacements.get(node) ?? prepared[`node-${index}`].class_type
        )
      )
    ]
  };
};
