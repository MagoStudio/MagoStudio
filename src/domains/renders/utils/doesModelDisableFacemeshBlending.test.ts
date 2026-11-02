import { VideoEngine } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { doesModelDisableFacemeshBlending } from "./doesModelDisableFacemeshBlending";

describe("doesModelDisableFacemeshBlending", () => {
  it.each([VideoEngine.V3_3_0, VideoEngine.V3_3_0_CNETS, VideoEngine.V3_4_0])(
    "returns true for %s, which declares the setting unsupported",
    (engine) => {
      expect(doesModelDisableFacemeshBlending(engine)).toBe(true);
    }
  );

  it.each([VideoEngine.V2_5_0, VideoEngine.V3_2_0])(
    "returns false for %s, which declares the setting supported",
    (engine) => {
      expect(doesModelDisableFacemeshBlending(engine)).toBe(false);
    }
  );

  it.each([
    VideoEngine.V4_0_0,
    VideoEngine.V5_1_0,
    VideoEngine.kling_o1,
    VideoEngine.v1_0_0_upscaler
  ])("returns false for %s, which does not expose the setting", (engine) => {
    expect(doesModelDisableFacemeshBlending(engine)).toBe(false);
  });

  it("returns false for an unknown engine", () => {
    expect(doesModelDisableFacemeshBlending("unknown_engine")).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(doesModelDisableFacemeshBlending(undefined)).toBe(false);
  });
});
