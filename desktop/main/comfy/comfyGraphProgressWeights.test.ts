import { describe, expect, it } from "vitest";

import { comfyGraphProgressWeights } from "./comfyGraphProgressWeights";

describe("comfyGraphProgressWeights", () => {
  it("weighs a sampler by its step count and every other node as one", () => {
    expect(
      comfyGraphProgressWeights({
        "1": { class_type: "UNETLoader", inputs: { unet_name: "model" } },
        "2": { class_type: "KSampler", inputs: { steps: 8, cfg: 1 } },
        "3": { class_type: "VAEDecode", inputs: {} }
      })
    ).toEqual({ "1": 1, "2": 8, "3": 1 });
  });

  it("weighs a split sampler by the steps it actually runs", () => {
    expect(
      comfyGraphProgressWeights({
        high: {
          class_type: "KSamplerAdvanced",
          inputs: { steps: 6, start_at_step: 0, end_at_step: 2 }
        },
        low: {
          class_type: "KSamplerAdvanced",
          inputs: { steps: 6, start_at_step: 2, end_at_step: 10000 }
        }
      })
    ).toEqual({ high: 2, low: 4 });
  });

  it("treats a linked or missing step count as a plain node", () => {
    expect(
      comfyGraphProgressWeights({
        "1": { class_type: "KSampler", inputs: { steps: ["9", 0] } },
        "2": { class_type: "Flux2Scheduler", inputs: { steps: 0 } }
      })
    ).toEqual({ "1": 1, "2": 1 });
  });
});
