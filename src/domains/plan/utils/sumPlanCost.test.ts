import { describe, expect, it } from "vitest";

import { sumPlanCost } from "./sumPlanCost";

describe("sumPlanCost", () => {
  it("multiplies the shared per-shot cost by the selection in shared-range mode", () => {
    const total = sumPlanCost({
      selectedIds: ["a", "b", "c"],
      img2imgCostPerShot: 2,
      fullShots: false,
      sharedVideoCostPerShot: 5,
      fullShotVideoCostById: {}
    });

    expect(total).toBe((2 + 5) * 3);
  });

  it("prices each shot by its own duration in full-shots mode", () => {
    const total = sumPlanCost({
      selectedIds: ["a", "b"],
      img2imgCostPerShot: 2,
      fullShots: true,
      sharedVideoCostPerShot: 5,
      fullShotVideoCostById: { a: 10, b: 20 }
    });

    expect(total).toBe(2 + 10 + (2 + 20));
  });

  it("treats unknown shot durations as zero video cost in full-shots mode", () => {
    const total = sumPlanCost({
      selectedIds: ["a", "b"],
      img2imgCostPerShot: 2,
      fullShots: true,
      sharedVideoCostPerShot: 5,
      fullShotVideoCostById: { a: 10 }
    });

    expect(total).toBe(2 + 10 + 2);
  });

  it("rounds image and video costs up independently", () => {
    const total = sumPlanCost({
      selectedIds: ["a"],
      img2imgCostPerShot: 1.2,
      fullShots: false,
      sharedVideoCostPerShot: 3.1,
      fullShotVideoCostById: {}
    });

    expect(total).toBe(2 + 4);
  });

  it("returns 0 for an empty selection", () => {
    const total = sumPlanCost({
      selectedIds: [],
      img2imgCostPerShot: 2,
      fullShots: false,
      sharedVideoCostPerShot: 5,
      fullShotVideoCostById: {}
    });

    expect(total).toBe(0);
  });

  it("excludes img2img cost for shots skipping img2img via an image override", () => {
    const total = sumPlanCost({
      selectedIds: ["a", "b"],
      img2imgCostPerShot: 2,
      fullShots: false,
      sharedVideoCostPerShot: 5,
      fullShotVideoCostById: {},
      shotIdsSkippingImg2Img: new Set(["a"])
    });

    expect(total).toBe(5 + (2 + 5));
  });

  it("charges full img2img cost when shotIdsSkippingImg2Img is omitted", () => {
    const total = sumPlanCost({
      selectedIds: ["a", "b"],
      img2imgCostPerShot: 2,
      fullShots: false,
      sharedVideoCostPerShot: 5,
      fullShotVideoCostById: {}
    });

    expect(total).toBe((2 + 5) * 2);
  });
});
