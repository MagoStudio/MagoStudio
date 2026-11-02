import { VideoEngine } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { resolveVideoModelOwningSettings } from "./resolveVideoModelOwningSettings";

describe("resolveVideoModelOwningSettings", () => {
  it("returns the video model named by mago_engine", () => {
    expect(
      resolveVideoModelOwningSettings({
        mago_engine: VideoEngine.happy_horse_1
      })?.name
    ).toBe(VideoEngine.happy_horse_1);
  });

  it("returns undefined when there are no settings at all", () => {
    expect(resolveVideoModelOwningSettings(undefined)).toBeUndefined();
  });

  it("returns undefined for img2img settings, which name their model in render_model", () => {
    expect(
      resolveVideoModelOwningSettings({
        render_model: "gpt_image_2",
        reference_images: [],
        width: 1024,
        height: 1024
      })
    ).toBeUndefined();
  });

  it("returns undefined for an engine that is not a known video model", () => {
    expect(
      resolveVideoModelOwningSettings({ mago_engine: "not_a_model" })
    ).toBeUndefined();
  });
});
