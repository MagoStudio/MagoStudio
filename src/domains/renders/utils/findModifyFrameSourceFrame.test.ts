import { Clip } from "@schemas/clip";
import { Layer, LayerType } from "@schemas/layer";
import { describe, expect, it } from "vitest";

import { findModifyFrameSourceFrame } from "./findModifyFrameSourceFrame";

const buildClip = (assetId: string, frame?: number): Clip =>
  ({
    id: `clip-${assetId}`,
    layer_id: "layer-img2img",
    name: `${frame}_1`,
    asset_id: assetId,
    asset: {},
    data: frame === undefined ? {} : { frame }
  }) as unknown as Clip;

const buildLayers = (clips: Clip[]): Layer[] =>
  [
    { id: "layer-video", type: LayerType.RENDER, clips: [] },
    { id: "layer-img2img", type: LayerType.IMG2IMG, clips }
  ] as unknown as Layer[];

describe("findModifyFrameSourceFrame", () => {
  it("returns the frame the matching Modify-frame clip was generated from", () => {
    const layers = buildLayers([buildClip("asset-a", 87)]);
    expect(findModifyFrameSourceFrame(layers, "asset-a")).toBe(87);
  });

  it("returns frame 0 rather than treating it as absent", () => {
    const layers = buildLayers([buildClip("asset-a", 0)]);
    expect(findModifyFrameSourceFrame(layers, "asset-a")).toBe(0);
  });

  it("picks the clip whose asset matches, not the first one", () => {
    const layers = buildLayers([
      buildClip("asset-a", 12),
      buildClip("asset-b", 340)
    ]);
    expect(findModifyFrameSourceFrame(layers, "asset-b")).toBe(340);
  });

  it("returns undefined for an uploaded asset with no Modify-frame clip", () => {
    const layers = buildLayers([buildClip("asset-a", 87)]);
    expect(
      findModifyFrameSourceFrame(layers, "uploaded-asset")
    ).toBeUndefined();
  });

  it("returns undefined when the matching clip records no frame", () => {
    const layers = buildLayers([buildClip("asset-a")]);
    expect(findModifyFrameSourceFrame(layers, "asset-a")).toBeUndefined();
  });

  it("returns undefined when there is no Modify-frame layer at all", () => {
    const layers = [
      { id: "layer-video", type: LayerType.RENDER, clips: [] }
    ] as unknown as Layer[];
    expect(findModifyFrameSourceFrame(layers, "asset-a")).toBeUndefined();
  });

  it("returns undefined without layers or without an asset id", () => {
    expect(findModifyFrameSourceFrame(undefined, "asset-a")).toBeUndefined();
    expect(
      findModifyFrameSourceFrame(
        buildLayers([buildClip("asset-a", 87)]),
        undefined
      )
    ).toBeUndefined();
  });
});
