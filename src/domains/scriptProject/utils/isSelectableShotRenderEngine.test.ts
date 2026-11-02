import { VideoEngine } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { MINIMAX_H3_MAX_SHOT_RENDER_ENGINE } from "../constants";

import { isSelectableShotRenderEngine } from "./isSelectableShotRenderEngine";

describe("isSelectableShotRenderEngine", () => {
  it("accepts the Fast engine", () => {
    expect(
      isSelectableShotRenderEngine(MINIMAX_H3_MAX_SHOT_RENDER_ENGINE)
    ).toBe(true);
  });

  it("accepts Seedance 2.5", () => {
    expect(isSelectableShotRenderEngine(VideoEngine.seedance_2_5)).toBe(true);
  });

  it("rejects the retired Slow engine", () => {
    expect(isSelectableShotRenderEngine(VideoEngine.minimax_reference)).toBe(
      false
    );
  });

  it("rejects a value the backend does not understand", () => {
    expect(isSelectableShotRenderEngine("v8.0.0")).toBe(false);
  });

  it("rejects an absent value", () => {
    expect(isSelectableShotRenderEngine(undefined)).toBe(false);
    expect(isSelectableShotRenderEngine(null)).toBe(false);
  });
});
