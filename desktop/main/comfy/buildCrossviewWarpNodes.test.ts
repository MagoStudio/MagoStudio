import { describe, expect, it } from "vitest";

import {
  buildCrossviewWarpNodes,
  CROSSVIEW_WARP_NODE_IDS
} from "./buildCrossviewWarpNodes";

describe("buildCrossviewWarpNodes", () => {
  it("sends every input MoGeInference requires, including refine_steps from ComfyUI v0.37.0", () => {
    const graph = buildCrossviewWarpNodes({
      sourceFrames: ["40", 0],
      camera: { azimuthDegrees: 30, elevationDegrees: 0 }
    });

    expect(
      Object.keys(graph[CROSSVIEW_WARP_NODE_IDS.depth].inputs).sort()
    ).toEqual([
      "apply_mask",
      "batch_size",
      "force_projection",
      "fov_x_degrees",
      "image",
      "moge_model",
      "refine_steps",
      "resolution_level"
    ]);
    expect(graph[CROSSVIEW_WARP_NODE_IDS.depth].inputs.refine_steps).toBe(0);
  });
});
