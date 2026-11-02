import { describe, expect, it } from "vitest";

import { toDeliveredVideoAssetFields } from "./toDeliveredVideoAssetFields";

describe("toDeliveredVideoAssetFields", () => {
  it("describes the asset as the video that was delivered", () => {
    expect(
      toDeliveredVideoAssetFields(
        { frameCount: 56, fps: 24, width: 1280, height: 720 },
        30
      )
    ).toEqual({
      frameCount: 56,
      fps: 24_000,
      duration: 2333,
      width: 1280,
      height: 720
    });
  });

  it("times the delivered frames at the registered rate when the file gives none", () => {
    expect(
      toDeliveredVideoAssetFields(
        { frameCount: 48, fps: null, width: null, height: null },
        24
      )
    ).toEqual({ frameCount: 48, fps: 24_000, duration: 2000 });
  });

  it("leaves the timing alone when no rate is known at all", () => {
    expect(
      toDeliveredVideoAssetFields(
        { frameCount: 48, fps: null, width: 64, height: 48 },
        undefined
      )
    ).toEqual({ frameCount: 48, width: 64, height: 48 });
  });
});
