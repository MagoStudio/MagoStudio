import { i18n } from "@config/i18n";
import { describe, expect, test } from "vitest";

const FRAME_LIMIT_A = 300;
const FRAME_LIMIT_B = 200;

describe("relaxed mode tooltip copy", () => {
  test("frame-limit tooltip interpolates the frame count and differs per value", () => {
    const tooltipA = i18n.t("payment.relaxed_mode_plan_tooltip.description", {
      frames: FRAME_LIMIT_A
    });
    const tooltipB = i18n.t("payment.relaxed_mode_plan_tooltip.description", {
      frames: FRAME_LIMIT_B
    });

    expect(tooltipA).toContain(String(FRAME_LIMIT_A));
    expect(tooltipB).toContain(String(FRAME_LIMIT_B));
    expect(tooltipA).not.toBe(tooltipB);
  });
});
