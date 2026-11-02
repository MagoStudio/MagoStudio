import type { ComfyGraph } from "./comfyGraph";

export const mergeComfyGraphParts = (parts: ComfyGraph[]): ComfyGraph =>
  parts.reduce<ComfyGraph>((mergedGraph, part) => {
    for (const nodeId of Object.keys(part)) {
      if (nodeId in mergedGraph)
        throw new Error(`ComfyUI graph node id ${nodeId} is used twice`);
    }
    return { ...mergedGraph, ...part };
  }, {});
