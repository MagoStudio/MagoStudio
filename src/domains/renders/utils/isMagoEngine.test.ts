import { VideoEngine } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { isMagoEngine } from "./isMagoEngine";

describe("isMagoEngine", () => {
  it.each([
    VideoEngine.V2_5_0,
    VideoEngine.V3_1_0,
    VideoEngine.V3_2_0,
    VideoEngine.V3_3_0,
    VideoEngine.V3_3_0_CNETS,
    VideoEngine.V3_4_0,
    VideoEngine.V4_0_0,
    VideoEngine.V4_1_0,
    VideoEngine.V5_0_0,
    VideoEngine.V5_1_0
  ])("returns true for Mago engine %s", (engine) => {
    expect(isMagoEngine(engine)).toBe(true);
  });

  it.each([
    VideoEngine.kling_o1,
    VideoEngine.kling_2_6_motion_control,
    VideoEngine.kling_3_motion_control,
    VideoEngine.kling_o3_edit_pro,
    VideoEngine.seedance_2,
    VideoEngine.happy_horse_1,
    VideoEngine.v1_0_0_upscaler,
    VideoEngine.v2_0_0_esrgan_upscaler,
    VideoEngine.v1_0_0_mask
  ])("returns false for non-Mago engine %s", (engine) => {
    expect(isMagoEngine(engine)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isMagoEngine(undefined)).toBe(false);
  });

  it("returns false for an unknown string", () => {
    expect(isMagoEngine("unknown_engine")).toBe(false);
  });
});
