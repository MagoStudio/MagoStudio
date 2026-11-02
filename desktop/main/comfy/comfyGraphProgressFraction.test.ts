import { describe, expect, it } from "vitest";

import { comfyGraphProgressFraction } from "./comfyGraphProgressFraction";

const weights = { loader: 1, sampler: 8, decode: 1 };

describe("comfyGraphProgressFraction", () => {
  it("is zero before any node finishes", () => {
    expect(
      comfyGraphProgressFraction({
        weights,
        finishedNodeIds: new Set(),
        currentNodeId: null,
        currentNodeStepFraction: 0
      })
    ).toBe(0);
  });

  it("counts finished nodes and the running sampler's step share", () => {
    expect(
      comfyGraphProgressFraction({
        weights,
        finishedNodeIds: new Set(["loader"]),
        currentNodeId: "sampler",
        currentNodeStepFraction: 0.5
      })
    ).toBeCloseTo(0.5);
  });

  it("does not count the current node twice once it is finished", () => {
    expect(
      comfyGraphProgressFraction({
        weights,
        finishedNodeIds: new Set(["loader", "sampler"]),
        currentNodeId: "sampler",
        currentNodeStepFraction: 1
      })
    ).toBeCloseTo(0.9);
  });

  it("ignores nodes outside the submitted graph and clamps step fractions", () => {
    expect(
      comfyGraphProgressFraction({
        weights,
        finishedNodeIds: new Set(["loader", "expanded.1"]),
        currentNodeId: "sampler",
        currentNodeStepFraction: 3
      })
    ).toBeCloseTo(0.9);
  });

  it("is zero for an empty graph", () => {
    expect(
      comfyGraphProgressFraction({
        weights: {},
        finishedNodeIds: new Set(),
        currentNodeId: null,
        currentNodeStepFraction: 0
      })
    ).toBe(0);
  });
});
