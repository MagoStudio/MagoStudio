import { Layer, LayerType } from "@schemas/layer";
import { describe, expect, it } from "vitest";

import { buildImg2ImgRenderName } from "./buildImg2ImgRenderName";

const makeLayer = (
  type: LayerType,
  clipFrames: Array<{ frame: number; status?: string }>
): Layer =>
  ({
    type,
    clips: clipFrames.map(({ frame, status }) => ({
      data: { frame, status }
    }))
  }) as unknown as Layer;

describe("buildImg2ImgRenderName", () => {
  it("returns `${frame}_1` when layers are undefined", () => {
    expect(buildImg2ImgRenderName(undefined, 163)).toBe("163_1");
  });

  it("returns `${frame}_1` when there is no IMG2IMG layer", () => {
    const layers = [makeLayer(LayerType.IMAGE, [{ frame: 163 }])];
    expect(buildImg2ImgRenderName(layers, 163)).toBe("163_1");
  });

  it("returns `${frame}_1` when the IMG2IMG layer has no clips on that frame", () => {
    const layers = [makeLayer(LayerType.IMG2IMG, [{ frame: 200 }])];
    expect(buildImg2ImgRenderName(layers, 163)).toBe("163_1");
  });

  it("counts all clips on the frame regardless of status (success/created/failed)", () => {
    const layers = [
      makeLayer(LayerType.IMG2IMG, [
        { frame: 163, status: "success" },
        { frame: 163, status: "created" },
        { frame: 200, status: "success" },
        { frame: 163, status: "failed" }
      ])
    ];
    expect(buildImg2ImgRenderName(layers, 163)).toBe("163_4");
  });

  it("uses the supplied frame, not anything derived from the layers", () => {
    const layers = [
      makeLayer(LayerType.IMG2IMG, [{ frame: 20, status: "success" }])
    ];
    expect(buildImg2ImgRenderName(layers, 5)).toBe("5_1");
  });

  it("counts existing clips when the iteration frame differs from the playhead", () => {
    const layers = [
      makeLayer(LayerType.IMG2IMG, [{ frame: 20, status: "success" }])
    ];
    expect(buildImg2ImgRenderName(layers, 20)).toBe("20_2");
  });
});
