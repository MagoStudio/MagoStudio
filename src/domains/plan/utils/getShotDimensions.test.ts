import { Layer, LayerType } from "@schemas/layer";
import { Shot } from "@schemas/shot";
import { describe, expect, it } from "vitest";

import { getShotDimensions } from "./getShotDimensions";

const makeShot = (layers: Partial<Layer>[]): Shot =>
  ({ layers }) as unknown as Shot;

const imageLayer = (assetData: Record<string, unknown>): Partial<Layer> => ({
  type: LayerType.IMAGE,
  clips: [{ asset: { data: assetData } } as Layer["clips"][0]]
});

describe("getShotDimensions", () => {
  it("reads width/height from the IMAGE layer source asset", () => {
    const shot = makeShot([imageLayer({ width: 3840, height: 2160 })]);

    expect(getShotDimensions(shot)).toEqual({ width: 3840, height: 2160 });
  });

  it("falls back to the size tuple when width/height are missing", () => {
    const shot = makeShot([imageLayer({ size: [1920, 1080] })]);

    expect(getShotDimensions(shot)).toEqual({ width: 1920, height: 1080 });
  });

  it("ignores RENDER layers and only reads the IMAGE source", () => {
    const shot = makeShot([
      { type: LayerType.RENDER, clips: [] },
      imageLayer({ width: 1280, height: 720 })
    ]);

    expect(getShotDimensions(shot)).toEqual({ width: 1280, height: 720 });
  });

  it("returns undefined dimensions when there is no IMAGE layer", () => {
    const shot = makeShot([{ type: LayerType.RENDER, clips: [] }]);

    expect(getShotDimensions(shot)).toEqual({
      width: undefined,
      height: undefined
    });
  });

  it("returns undefined dimensions when the source has no size data", () => {
    const shot = makeShot([imageLayer({})]);

    expect(getShotDimensions(shot)).toEqual({
      width: undefined,
      height: undefined
    });
  });
});
