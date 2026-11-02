import { VideoEngine } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { applyMagoCreditDiscount } from "./magoCreditDiscount";

describe("applyMagoCreditDiscount", () => {
  const AFFECTED: Array<[string, VideoEngine]> = [
    ["v3.4.0", VideoEngine.V3_4_0],
    ["v4.0.0", VideoEngine.V4_0_0],
    ["v4.1.0", VideoEngine.V4_1_0],
    ["v5.0.0", VideoEngine.V5_0_0],
    ["v5.1.0", VideoEngine.V5_1_0],
    ["v1.0_upscaler", VideoEngine.v1_0_0_upscaler],
    ["v2.0.0_esrgan_upscaler", VideoEngine.v2_0_0_esrgan_upscaler],
    ["v1.0.0.mask", VideoEngine.v1_0_0_mask],
    ["v9.1.0", VideoEngine.minimax_reference]
  ];

  const NOT_AFFECTED: Array<[string, VideoEngine]> = [
    ["v2.5.0", VideoEngine.V2_5_0],
    ["v3.1.0", VideoEngine.V3_1_0],
    ["v3.2.0", VideoEngine.V3_2_0],
    ["v3.3.0", VideoEngine.V3_3_0],
    ["v3.3.0.cnets", VideoEngine.V3_3_0_CNETS],
    ["kling_o1", VideoEngine.kling_o1],
    ["kling_3_motion_control", VideoEngine.kling_3_motion_control],
    ["seedance_2", VideoEngine.seedance_2],
    ["happy_horse_1", VideoEngine.happy_horse_1]
  ];

  it.each(AFFECTED)(
    "returns Math.ceil(credits * 0.7) for affected engine %s",
    (_, engine) => {
      expect(applyMagoCreditDiscount(1000, engine)).toBe(700);
      expect(applyMagoCreditDiscount(123, engine)).toBe(Math.ceil(123 * 0.7));
      expect(applyMagoCreditDiscount(1, engine)).toBe(1);
      expect(applyMagoCreditDiscount(0, engine)).toBe(0);
    }
  );

  it.each(NOT_AFFECTED)(
    "applies no discount but still ceils to whole credits for %s",
    (_, engine) => {
      expect(applyMagoCreditDiscount(1000, engine)).toBe(1000);
      expect(applyMagoCreditDiscount(123.45, engine)).toBe(124);
      expect(applyMagoCreditDiscount(0, engine)).toBe(0);
    }
  );
});
