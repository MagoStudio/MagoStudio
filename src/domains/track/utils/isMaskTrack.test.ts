import { VideoEngine } from "@models/video/types";
import { Layer } from "@schemas/layer";
import { describe, expect, it } from "vitest";

import { isMaskTrack } from "./isMaskTrack";

const makeTrack = (overrides: {
  mago_engine?: string;
  noSettings?: boolean;
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

describe("isMaskTrack", () => {
  it("returns true for a track with the SAM3 mask engine", () => {
    expect(
      isMaskTrack(makeTrack({ mago_engine: VideoEngine.v1_0_0_mask }))
    ).toBe(true);
  });

  it("returns false for a track with any other mago_engine", () => {
    expect(isMaskTrack(makeTrack({ mago_engine: VideoEngine.V5_1_0 }))).toBe(
      false
    );
  });

  it("returns false when render settings are missing", () => {
    expect(isMaskTrack(makeTrack({ noSettings: true }))).toBe(false);
  });
});
