import { VideoEngine } from "@models/video/types";
import { Layer } from "@schemas/layer";
import { describe, expect, it } from "vitest";

import { isRenderOutputTrack } from "./isRenderOutputTrack";

const makeTrack = (overrides: {
  type?: string;
  mago_engine?: string;
  noSettings?: boolean;
}): Layer =>
  ({
    id: "t1",
    name: "t",
    type: overrides.type ?? "render",
    clips: [
      {
        id: "c1",
        asset_id: "a1",
        asset: {
          id: "a1",
          name: "",
          data: overrides.noSettings
            ? {}
            : {
                data: {
                  render_settings: {
                    magov2: { mago_engine: overrides.mago_engine }
                  }
                }
              }
        } as never,
        data: {}
      } as never
    ],
    data: {}
  }) as unknown as Layer;

describe("isRenderOutputTrack", () => {
  it("returns true for a real render track", () => {
    expect(
      isRenderOutputTrack(makeTrack({ mago_engine: VideoEngine.V5_1_0 }))
    ).toBe(true);
  });

  it("returns false for a mask track (same LayerType.RENDER, mask engine)", () => {
    expect(
      isRenderOutputTrack(makeTrack({ mago_engine: VideoEngine.v1_0_0_mask }))
    ).toBe(false);
  });

  it("returns false for a non-render track type", () => {
    expect(isRenderOutputTrack(makeTrack({ type: "image" }))).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isRenderOutputTrack(undefined)).toBe(false);
  });
});
