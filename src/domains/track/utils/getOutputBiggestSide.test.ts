import { VideoEngine } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { getOutputBiggestSide } from "./getOutputBiggestSide";

describe("getOutputBiggestSide", () => {
  it.each([
    VideoEngine.V4_0_0,
    VideoEngine.V7_0_0,
    VideoEngine.V8_0_0,
    VideoEngine.v1_0_0_upscaler,
    VideoEngine.v2_0_0_esrgan_upscaler
  ])(
    "returns the backend-reported output size when present, for engine %s",
    (mago_engine) => {
      expect(
        getOutputBiggestSide({ mago_engine, max_size: 1280 }, [640, 360])
      ).toBe(640);
    }
  );

  it("falls back to max_size for v7.0.0 with no reported output size", () => {
    expect(
      getOutputBiggestSide(
        { mago_engine: VideoEngine.V7_0_0, max_size: 1280 },
        undefined
      )
    ).toBe(1280);
  });

  it.each([VideoEngine.v1_0_0_upscaler, VideoEngine.v2_0_0_esrgan_upscaler])(
    "returns undefined for scale-factor upscaler %s with no reported output size",
    (mago_engine) => {
      expect(
        getOutputBiggestSide({ mago_engine, max_size: 1280 }, undefined)
      ).toBeUndefined();
    }
  );

  it("falls back to max_size for a plain render engine with no reported output size", () => {
    expect(
      getOutputBiggestSide(
        { mago_engine: VideoEngine.V4_0_0, max_size: 960 },
        undefined
      )
    ).toBe(960);
  });

  it("returns undefined when renderSettings is undefined", () => {
    expect(getOutputBiggestSide(undefined, [640, 360])).toBeUndefined();
  });
});
