import { VideoEngine } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { isCropCapableEngine } from "./isCropCapableEngine";

const MAGO_CLOUD_ENGINES = [
  VideoEngine.V2_5_0,
  VideoEngine.V3_1_0,
  VideoEngine.V3_2_0,
  VideoEngine.V3_3_0,
  VideoEngine.V3_3_0_CNETS,
  VideoEngine.V3_4_0,
  VideoEngine.V4_0_0,
  VideoEngine.V4_1_0,
  VideoEngine.V5_0_0,
  VideoEngine.V5_1_0,
  VideoEngine.V7_0_0,
  VideoEngine.V8_0_0,
  VideoEngine.v1_0_0_upscaler,
  VideoEngine.v2_0_0_esrgan_upscaler,
  VideoEngine.v1_0_0_mask
];

const CLOUD_INTEGRATED_ENGINES = [
  VideoEngine.seedance_2,
  VideoEngine.happy_horse_1,
  VideoEngine.kling_o1,
  VideoEngine.kling_o3_edit_pro,
  VideoEngine.kling_2_6_motion_control,
  VideoEngine.kling_3_motion_control
];

const COMFY_ENGINES = [
  VideoEngine.wan_animate_2_2,
  VideoEngine.wan_vace_2_1,
  VideoEngine.mago_style_transfer_local,
  VideoEngine.mago_animate
];

describe("isCropCapableEngine", () => {
  it.each(MAGO_CLOUD_ENGINES)(
    "returns true for Mago engine %s rendered on Mago cloud",
    (engine) => {
      expect(isCropCapableEngine(engine, "mago-cloud")).toBe(true);
    }
  );

  it.each(CLOUD_INTEGRATED_ENGINES)(
    "returns false for %s when it renders on Mago cloud, which ignores its crop",
    (engine) => {
      expect(isCropCapableEngine(engine, "mago-cloud")).toBe(false);
    }
  );

  it.each(COMFY_ENGINES)(
    "returns true for Comfy engine %s rendered locally",
    (engine) => {
      expect(isCropCapableEngine(engine, "local-comfy")).toBe(true);
    }
  );

  it.each(COMFY_ENGINES)(
    "resolves Comfy engine %s to its local provider by default",
    (engine) => {
      expect(isCropCapableEngine(engine)).toBe(true);
    }
  );

  it("does not offer cropping for unavailable cloud integrations", () => {
    expect(isCropCapableEngine(VideoEngine.seedance_2, null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isCropCapableEngine(undefined)).toBe(false);
  });

  it("returns false for an unknown string", () => {
    expect(isCropCapableEngine("unknown_engine", "mago-cloud")).toBe(false);
  });
});
