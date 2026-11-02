import { describe, expect, it } from "vitest";

import {
  assertSourceDimensionsMatch,
  cropBackFilter,
  cropFilter,
  normalizeCrop,
  readCropCoordinates,
  readSourceDimensions,
  toCropBack,
  toCropCoordinates,
  type CropCoordinates
} from "./cropPlan";

const coords = (
  x1: number,
  y1: number,
  x2: number,
  y2: number
): CropCoordinates => ({ top_left: [x1, y1], bottom_right: [x2, y2] });

describe("normalizeCrop", () => {
  it("returns null when there is no box", () => {
    expect(normalizeCrop([1920, 1080], undefined)).toBeNull();
  });

  it("snaps the input crop up to the alignment and keeps the requested box exact", () => {
    const plan = normalizeCrop([1920, 1080], coords(0, 0, 100, 100));
    expect(plan?.inputCrop).toEqual({ x: 0, y: 0, w: 128, h: 128 });
    expect(plan?.requested).toEqual({ x: 0, y: 0, w: 100, h: 100 });
  });

  it("leaves an already aligned box unchanged", () => {
    const plan = normalizeCrop([1920, 1080], coords(64, 128, 192, 320));
    expect(plan?.inputCrop).toEqual({ x: 64, y: 128, w: 128, h: 192 });
    expect(plan?.requested).toEqual({ x: 64, y: 128, w: 128, h: 192 });
  });

  it("clamps out-of-bounds corners, so a box covering everything is a no-op", () => {
    expect(normalizeCrop([256, 256], coords(-50, -50, 999, 999))).toBeNull();
  });

  it("shifts the snapped origin back inside the frame at the far edge", () => {
    const plan = normalizeCrop([256, 256], coords(180, 0, 250, 128));
    expect(plan?.inputCrop).toEqual({ x: 128, y: 0, w: 128, h: 128 });
    expect(plan?.requested).toEqual({ x: 180, y: 0, w: 70, h: 128 });
  });

  it("keeps the input crop a superset of the requested box when the origin snaps down", () => {
    const plan = normalizeCrop([1920, 1080], coords(65, 1, 193, 65));
    const inputCrop = plan!.inputCrop!;
    const requested = plan!.requested;
    expect(inputCrop.x % 2).toBe(0);
    expect(inputCrop.y % 2).toBe(0);
    expect(inputCrop.x).toBeLessThanOrEqual(requested.x);
    expect(inputCrop.y).toBeLessThanOrEqual(requested.y);
    expect(inputCrop.x + inputCrop.w).toBeGreaterThanOrEqual(
      requested.x + requested.w
    );
    expect(inputCrop.y + inputCrop.h).toBeGreaterThanOrEqual(
      requested.y + requested.h
    );
  });

  it("snaps an odd origin down to even for the yuv420p crop offset", () => {
    const plan = normalizeCrop([1920, 1080], coords(181, 129, 309, 321));
    expect(plan!.inputCrop!.x % 2).toBe(0);
    expect(plan!.inputCrop!.y % 2).toBe(0);
    expect(plan?.requested).toEqual({ x: 181, y: 129, w: 128, h: 192 });
  });

  it("leaves the input uncropped when the snapped box fills the frame", () => {
    const plan = normalizeCrop([128, 128], coords(4, 4, 120, 120));
    expect(plan?.inputCrop).toBeNull();
    expect(plan?.requested).toEqual({ x: 4, y: 4, w: 116, h: 116 });
  });

  it("throws on a zero-area box", () => {
    expect(() =>
      normalizeCrop([1920, 1080], coords(100, 100, 100, 100))
    ).toThrow();
  });

  it("throws on a negative-area box", () => {
    expect(() =>
      normalizeCrop([1920, 1080], coords(200, 200, 100, 100))
    ).toThrow();
  });

  it("keeps a sub-align box exactly as drawn and grows only the input", () => {
    const plan = normalizeCrop([1920, 1080], coords(0, 0, 32, 32));
    expect(plan?.requested).toEqual({ x: 0, y: 0, w: 32, h: 32 });
    expect(plan?.inputCrop).toEqual({ x: 0, y: 0, w: 64, h: 64 });
  });

  it("never widens the drawn box on a sub-align axis", () => {
    const plan = normalizeCrop([1920, 1080], coords(100, 300, 140, 500));
    expect(plan?.requested).toEqual({ x: 100, y: 300, w: 40, h: 200 });
    expect(plan?.inputCrop).toEqual({ x: 100, y: 300, w: 64, h: 256 });
  });

  it("floors a degenerate one-pixel box to an encodable even size", () => {
    const plan = normalizeCrop([1920, 1080], coords(10, 10, 11, 11));
    expect(plan?.requested).toEqual({ x: 10, y: 10, w: 2, h: 2 });
  });

  it("returns null for a full-frame box", () => {
    expect(normalizeCrop([256, 256], coords(0, 0, 256, 256))).toBeNull();
  });

  it("falls back to the largest even span when an align block will not fit", () => {
    const plan = normalizeCrop([200, 200], coords(0, 0, 200, 100));
    expect(plan!.inputCrop!.w).toBe(200);
    expect(plan!.inputCrop!.w % 2).toBe(0);
  });

  it("throws on non-positive source dimensions", () => {
    expect(() => normalizeCrop([0, 1080], coords(0, 0, 100, 100))).toThrow();
  });
});

describe("toCropBack", () => {
  it("expresses the requested box relative to the applied input crop", () => {
    const plan = normalizeCrop([1920, 1080], coords(100, 100, 300, 300))!;
    expect(plan.inputCrop).toEqual({ x: 100, y: 100, w: 256, h: 256 });
    expect(toCropBack(plan, [1920, 1080])).toEqual({
      sourceDims: [256, 256],
      rect: { x: 0, y: 0, w: 200, h: 200 }
    });
  });

  it("crops back to the exact drawn box even when the input was grown to /64", () => {
    const plan = normalizeCrop([1920, 1080], coords(100, 300, 140, 500))!;
    expect(plan.inputCrop).toEqual({ x: 100, y: 300, w: 64, h: 256 });
    expect(toCropBack(plan, [1920, 1080])).toEqual({
      sourceDims: [64, 256],
      rect: { x: 0, y: 0, w: 40, h: 200 }
    });
  });

  it("falls back to the full frame when the input was left uncropped", () => {
    const plan = normalizeCrop([128, 128], coords(4, 4, 120, 120))!;
    expect(plan.inputCrop).toBeNull();
    expect(toCropBack(plan, [128, 128])).toEqual({
      sourceDims: [128, 128],
      rect: { x: 4, y: 4, w: 116, h: 116 }
    });
  });
});

describe("toCropCoordinates", () => {
  it("round-trips a rect back into the exclusive bottom-right wire shape", () => {
    expect(toCropCoordinates({ x: 100, y: 200, w: 64, h: 128 })).toEqual({
      top_left: [100, 200],
      bottom_right: [164, 328]
    });
  });

  it("round-trips through normalizeCrop unchanged for an aligned box", () => {
    const plan = normalizeCrop([1920, 1080], coords(64, 128, 192, 320))!;
    expect(toCropCoordinates(plan.requested)).toEqual({
      top_left: [64, 128],
      bottom_right: [192, 320]
    });
  });
});

describe("cropFilter", () => {
  it("builds an ffmpeg crop fragment for the input crop", () => {
    expect(cropFilter({ x: 64, y: 32, w: 128, h: 256 })).toBe(
      "crop=128:256:64:32"
    );
  });
});

describe("cropBackFilter", () => {
  it("scales the crop-back rect against the actual frame size", () => {
    const filter = cropBackFilter({
      sourceDims: [256, 256],
      rect: { x: 0, y: 0, w: 200, h: 200 }
    });
    expect(filter).toBe(
      "crop=w='min(round(200*iw/256/2)*2,iw)':" +
        "h='min(round(200*ih/256/2)*2,ih)':" +
        "x='max(min(round(0*iw/256/2)*2,iw-ow),0)':" +
        "y='max(min(round(0*ih/256/2)*2,ih-oh),0)'"
    );
  });

  it("returns null for a degenerate rect", () => {
    expect(
      cropBackFilter({
        sourceDims: [256, 256],
        rect: { x: 0, y: 0, w: 0, h: 8 }
      })
    ).toBeNull();
  });
});

describe("readCropCoordinates", () => {
  it("reads a well-formed box", () => {
    expect(
      readCropCoordinates({ top_left: [1, 2], bottom_right: [3, 4] })
    ).toEqual({ top_left: [1, 2], bottom_right: [3, 4] });
  });

  it("rejects stringified corners", () => {
    expect(
      readCropCoordinates({
        top_left: ["0", "0"],
        bottom_right: ["640", "704"]
      })
    ).toBeUndefined();
  });

  it("rejects a missing corner", () => {
    expect(readCropCoordinates({ top_left: [0, 0] })).toBeUndefined();
  });

  it("rejects a non-object", () => {
    expect(readCropCoordinates(null)).toBeUndefined();
    expect(readCropCoordinates("crop")).toBeUndefined();
  });
});

describe("readSourceDimensions", () => {
  it("reads a positive pair", () => {
    expect(readSourceDimensions([1920, 1080])).toEqual([1920, 1080]);
  });

  it("rejects a non-positive pair", () => {
    expect(readSourceDimensions([0, 1080])).toBeUndefined();
  });

  it("rejects a malformed pair", () => {
    expect(readSourceDimensions([1920])).toBeUndefined();
  });
});

describe("assertSourceDimensionsMatch", () => {
  it("accepts matching dimensions", () => {
    expect(() =>
      assertSourceDimensionsMatch([1920, 1080], [1920, 1080])
    ).not.toThrow();
  });

  it("throws when the crop was drawn against another size", () => {
    expect(() =>
      assertSourceDimensionsMatch([1920, 1080], [1280, 720])
    ).toThrow(/Redraw the crop/);
  });
});
