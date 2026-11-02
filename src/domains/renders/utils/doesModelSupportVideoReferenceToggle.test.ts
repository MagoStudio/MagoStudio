import { VideoEngine } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { doesModelSupportVideoReferenceToggle } from "./doesModelSupportVideoReferenceToggle";

describe("doesModelSupportVideoReferenceToggle", () => {
  it("returns true for minimax_reference, which declares the toggle", () => {
    expect(
      doesModelSupportVideoReferenceToggle(VideoEngine.minimax_reference)
    ).toBe(true);
  });

  it.each([VideoEngine.kling_o1, VideoEngine.v1_0_0_upscaler])(
    "returns false for %s, which does not declare the toggle",
    (engine) => {
      expect(doesModelSupportVideoReferenceToggle(engine)).toBe(false);
    }
  );

  it("returns false for an unknown engine", () => {
    expect(doesModelSupportVideoReferenceToggle("unknown_engine")).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(doesModelSupportVideoReferenceToggle(undefined)).toBe(false);
  });
});
