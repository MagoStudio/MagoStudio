import { Layer, LayerType } from "@schemas/layer";
import { Shot } from "@schemas/shot";
import { describe, expect, it } from "vitest";

import { getShotFrameCount } from "./getShotFrameCount";

const makeShot = (layers: Partial<Layer>[]): Shot =>
  ({ layers }) as unknown as Shot;

const imageLayer = (assetData: Record<string, unknown>): Partial<Layer> => ({
  type: LayerType.IMAGE,
  clips: [{ asset: { data: assetData } } as Layer["clips"][0]]
});

describe("getShotFrameCount", () => {
  it("reads total_frames from the IMAGE layer source asset", () => {
    const shot = makeShot([imageLayer({ total_frames: 48, duration: 47 })]);

    expect(getShotFrameCount(shot)).toBe(48);
  });

  it("falls back to duration when total_frames is missing", () => {
    const shot = makeShot([imageLayer({ duration: 30 })]);

    expect(getShotFrameCount(shot)).toBe(30);
  });

  it("ignores RENDER layers and only reads the IMAGE source", () => {
    const shot = makeShot([
      { type: LayerType.RENDER, clips: [] },
      imageLayer({ total_frames: 12 })
    ]);

    expect(getShotFrameCount(shot)).toBe(12);
  });

  it("returns undefined when there is no IMAGE layer", () => {
    const shot = makeShot([{ type: LayerType.RENDER, clips: [] }]);

    expect(getShotFrameCount(shot)).toBeUndefined();
  });

  it("returns undefined when the source duration is unknown", () => {
    const shot = makeShot([imageLayer({})]);

    expect(getShotFrameCount(shot)).toBeUndefined();
  });
});
