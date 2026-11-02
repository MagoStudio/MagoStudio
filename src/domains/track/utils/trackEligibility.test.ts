import { Layer, LayerType } from "@schemas/layer";
import { describe, expect, it } from "vitest";

import {
  filterEligibleLayers,
  isEligibleRenderTrack
} from "./trackEligibility";

const renderTrack = (overrides: {
  engine?: string;
  clips?: unknown[];
}): Layer =>
  ({
    type: LayerType.RENDER,
    data: { renderEngine: overrides.engine ?? "magov2" },
    clips: overrides.clips ?? [{ id: "c1" }]
  }) as unknown as Layer;

const imageTrack = (): Layer =>
  ({
    type: LayerType.IMAGE,
    data: {},
    clips: [{ id: "c1" }]
  }) as unknown as Layer;

describe("isEligibleRenderTrack", () => {
  it("accepts a magoV2 render track with clips", () => {
    expect(isEligibleRenderTrack(renderTrack({}))).toBe(true);
  });

  it("rejects a magoV1 render track", () => {
    expect(isEligibleRenderTrack(renderTrack({ engine: "magov1" }))).toBe(
      false
    );
  });

  it("rejects an empty render track", () => {
    expect(isEligibleRenderTrack(renderTrack({ clips: [] }))).toBe(false);
  });

  it("rejects non-render tracks", () => {
    expect(isEligibleRenderTrack(imageTrack())).toBe(false);
  });
});

describe("filterEligibleLayers", () => {
  it("keeps non-render tracks untouched", () => {
    const image = imageTrack();
    const result = filterEligibleLayers([image]);
    expect(result).toEqual([image]);
  });

  it("filters out ineligible render tracks but preserves the rest", () => {
    const image = imageTrack();
    const eligible = renderTrack({});
    const v1 = renderTrack({ engine: "magov1" });
    const empty = renderTrack({ clips: [] });

    expect(filterEligibleLayers([image, eligible, v1, empty])).toEqual([
      image,
      eligible
    ]);
  });
});
