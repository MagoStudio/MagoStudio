import { AssetStatus } from "@schemas/asset";
import { describe, expect, test } from "vitest";

import { canPromoteRenderToShot } from "./canPromoteRenderToShot";

describe("canPromoteRenderToShot", () => {
  test("withholds promotion while the render is queued", () => {
    expect(
      canPromoteRenderToShot({
        status: AssetStatus.INQUEUE,
        hasOutputAsset: true
      })
    ).toBe(false);
  });

  test("withholds promotion when the render failed", () => {
    expect(
      canPromoteRenderToShot({
        status: AssetStatus.ERROR,
        hasOutputAsset: true
      })
    ).toBe(false);
  });

  test("allows promotion when the render finished and has an output asset", () => {
    expect(
      canPromoteRenderToShot({
        status: AssetStatus.FINISHED,
        hasOutputAsset: true
      })
    ).toBe(true);
  });

  test("withholds promotion when finished but the output asset is missing", () => {
    expect(
      canPromoteRenderToShot({
        status: AssetStatus.FINISHED,
        hasOutputAsset: false
      })
    ).toBe(false);
  });
});
