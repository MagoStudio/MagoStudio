import { describe, expect, it } from "vitest";

import { computeObjectContainBox } from "./computeObjectContainBox";

describe("computeObjectContainBox", () => {
  it("fills the container when the aspect ratios match", () => {
    const box = computeObjectContainBox({
      containerWidth: 1000,
      containerHeight: 500,
      mediaWidth: 1920,
      mediaHeight: 960
    });

    expect(box).toEqual({ left: 0, top: 0, width: 1000, height: 500 });
  });

  it("letterboxes top and bottom when the media is wider than the container", () => {
    const box = computeObjectContainBox({
      containerWidth: 1000,
      containerHeight: 1000,
      mediaWidth: 1920,
      mediaHeight: 1080
    });

    expect(box.left).toBe(0);
    expect(box.width).toBe(1000);
    expect(box.height).toBeCloseTo((1000 * 1080) / 1920, 5);
    expect(box.top).toBeCloseTo((1000 - box.height) / 2, 5);
  });

  it("letterboxes left and right (pillarbox) when the media is taller than the container", () => {
    const box = computeObjectContainBox({
      containerWidth: 1000,
      containerHeight: 1000,
      mediaWidth: 1080,
      mediaHeight: 1920
    });

    expect(box.top).toBe(0);
    expect(box.height).toBe(1000);
    expect(box.width).toBeCloseTo((1000 * 1080) / 1920, 5);
    expect(box.left).toBeCloseTo((1000 - box.width) / 2, 5);
  });

  it("falls back to the container size when any dimension is zero or unknown", () => {
    const box = computeObjectContainBox({
      containerWidth: 1000,
      containerHeight: 500,
      mediaWidth: 0,
      mediaHeight: 0
    });

    expect(box).toEqual({ left: 0, top: 0, width: 1000, height: 500 });
  });
});
