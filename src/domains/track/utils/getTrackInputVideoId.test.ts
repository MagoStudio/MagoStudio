import { Layer } from "@schemas/layer";
import { describe, expect, it } from "vitest";

import { getTrackInputVideoId } from "./getTrackInputVideoId";

const makeTrack = (overrides: {
  assetVideo?: string;
  clipVideo?: string;
}): Layer =>
  ({
    id: "t1",
    name: "t",
    type: "render",
    clips: [
      {
        id: "c1",
        asset_id: "a1",
        asset: {
          id: "a1",
          name: "",
          data:
            overrides.assetVideo !== undefined
              ? { data: { sources: { video: overrides.assetVideo } } }
              : {}
        } as never,
        data:
          overrides.clipVideo !== undefined
            ? { sources: { video: overrides.clipVideo } }
            : {}
      } as never
    ],
    data: {}
  }) as unknown as Layer;

describe("getTrackInputVideoId", () => {
  it("reads the input video id from the canonical asset path", () => {
    expect(getTrackInputVideoId(makeTrack({ assetVideo: "input-1" }))).toBe(
      "input-1"
    );
  });

  it("falls back to the legacy clip path when the asset path is absent", () => {
    expect(getTrackInputVideoId(makeTrack({ clipVideo: "input-2" }))).toBe(
      "input-2"
    );
  });

  it("prefers the canonical asset path over the legacy clip path", () => {
    expect(
      getTrackInputVideoId(
        makeTrack({ assetVideo: "asset-input", clipVideo: "clip-input" })
      )
    ).toBe("asset-input");
  });

  it("returns undefined when neither path carries a video id", () => {
    expect(getTrackInputVideoId(makeTrack({}))).toBeUndefined();
  });

  it("returns undefined for an undefined track", () => {
    expect(getTrackInputVideoId(undefined)).toBeUndefined();
  });
});
