import { describe, expect, it } from "vitest";

import {
  DEFAULT_RESOLUTION_ID,
  SCRIPT_PROJECT_ASPECT_RATIOS
} from "../constants";

import { buildAspectFitStyle } from "./buildAspectFitStyle";
import { buildOutputSize } from "./buildOutputSize";

describe("buildAspectFitStyle", () => {
  it("fills the width and lets the height follow the aspect when given no height", () => {
    expect(buildAspectFitStyle([720, 1280])).toEqual({
      aspectRatio: "720 / 1280",
      width: "100%"
    });
  });

  it("carries the output size through as the aspect ratio", () => {
    expect(buildAspectFitStyle([1280, 720], "100cqh")).toEqual({
      aspectRatio: "1280 / 720",
      width: "min(100%, calc(100cqh * 1280 / 720))"
    });
  });

  it("bounds a portrait output by the height it is given", () => {
    expect(buildAspectFitStyle([720, 1280], "100cqh")).toEqual({
      aspectRatio: "720 / 1280",
      width: "min(100%, calc(100cqh * 720 / 1280))"
    });
  });

  it.each(SCRIPT_PROJECT_ASPECT_RATIOS.map((ratio) => ratio.id))(
    "fits the %s project aspect ratio on both axes",
    (aspectRatioId) => {
      const outputSize = buildOutputSize(aspectRatioId, DEFAULT_RESOLUTION_ID);
      const bounded = buildAspectFitStyle(outputSize, "100cqh");
      const full = buildAspectFitStyle(outputSize);

      expect(bounded.aspectRatio).toBe(`${outputSize[0]} / ${outputSize[1]}`);
      expect(bounded.width).toBe(
        `min(100%, calc(100cqh * ${outputSize[0]} / ${outputSize[1]}))`
      );
      expect(full).toEqual({ aspectRatio: bounded.aspectRatio, width: "100%" });
    }
  );

  it("falls back to a square filling the width when the output size is unusable", () => {
    expect(buildAspectFitStyle([0, 0], "100cqh")).toEqual({
      aspectRatio: "1 / 1",
      width: "100%"
    });
  });
});
