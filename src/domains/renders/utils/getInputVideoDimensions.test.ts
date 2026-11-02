import { Layer } from "@schemas/layer";
import { describe, expect, it } from "vitest";

import { getInputVideoDimensions } from "./getInputVideoDimensions";

const makeTrack = (data: Record<string, unknown> | undefined): Layer =>
  ({
    id: "track",
    name: "input",
    clips: [{ id: "clip", asset_id: "asset", asset: { id: "asset", data } }]
  }) as unknown as Layer;

describe("getInputVideoDimensions", () => {
  it("returns undefined dimensions without a source track", () => {
    expect(getInputVideoDimensions(undefined)).toEqual({
      inputVideoWidth: undefined,
      inputVideoHeight: undefined
    });
  });

  it("reads explicit width/height from the first clip's asset data", () => {
    expect(
      getInputVideoDimensions(makeTrack({ width: 1920, height: 1080 }))
    ).toEqual({ inputVideoWidth: 1920, inputVideoHeight: 1080 });
  });

  it("prefers explicit width/height over the size tuple", () => {
    expect(
      getInputVideoDimensions(
        makeTrack({ width: 1920, height: 1080, size: [100, 200] })
      )
    ).toEqual({ inputVideoWidth: 1920, inputVideoHeight: 1080 });
  });

  it("falls back to the size tuple", () => {
    expect(getInputVideoDimensions(makeTrack({ size: [1280, 720] }))).toEqual({
      inputVideoWidth: 1280,
      inputVideoHeight: 720
    });
  });

  it("returns undefined dimensions when asset data is missing", () => {
    expect(getInputVideoDimensions(makeTrack(undefined))).toEqual({
      inputVideoWidth: undefined,
      inputVideoHeight: undefined
    });
  });
});
