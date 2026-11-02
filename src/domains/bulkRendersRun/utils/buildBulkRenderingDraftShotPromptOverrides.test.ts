import { describe, expect, it } from "vitest";

import { buildBulkRenderingDraftShotPromptOverrides } from "./buildBulkRenderingDraftShotPromptOverrides";

const DEFAULT_IMAGE_PROMPT = "default image prompt";
const DEFAULT_VIDEO_PROMPT = "default video prompt";

const build = (
  imageEntries: [string, string][],
  videoEntries: [string, string][] = []
) =>
  buildBulkRenderingDraftShotPromptOverrides({
    imagePromptByShotId: new Map(imageEntries),
    videoPromptByShotId: new Map(videoEntries),
    defaultImagePrompt: DEFAULT_IMAGE_PROMPT,
    defaultVideoPrompt: DEFAULT_VIDEO_PROMPT
  });

describe("buildBulkRenderingDraftShotPromptOverrides", () => {
  it("emits an override for a Shot whose prompt genuinely differs from the default", () => {
    const overrides = build([["shot-1", "a different image prompt"]]);

    expect(overrides).toEqual({
      "shot-1": { imagePrompt: "a different image prompt" }
    });
  });

  it("never emits an override whose prompt is an empty string, falling back to the run-level prompt", () => {
    const overrides = build([["shot-1", ""]]);

    expect(overrides).toEqual({});
  });

  it("never emits an override whose prompt is whitespace only", () => {
    const overrides = build([["shot-1", "   \n\t "]]);

    expect(overrides).toEqual({});
  });

  it("does not emit an override equal to the default prompt", () => {
    const overrides = build([["shot-1", DEFAULT_IMAGE_PROMPT]]);

    expect(overrides).toEqual({});
  });

  it("applies the same empty/whitespace guard to the video prompt", () => {
    const overrides = build([], [["shot-1", "  "]]);

    expect(overrides).toEqual({});
  });

  it("carries both an image and a video override for the same Shot when both are edited", () => {
    const overrides = build(
      [["shot-1", "a different image prompt"]],
      [["shot-1", "a different video prompt"]]
    );

    expect(overrides).toEqual({
      "shot-1": {
        imagePrompt: "a different image prompt",
        videoPrompt: "a different video prompt"
      }
    });
  });

  it("omits a Shot that was touched but whose value cleared back to empty", () => {
    const overrides = build([["shot-1", ""]], [["shot-1", "   "]]);

    expect(overrides).toEqual({});
  });

  it("leaves an untouched Shot out entirely", () => {
    const overrides = build([["shot-1", "a different image prompt"]]);

    expect(Object.keys(overrides)).toEqual(["shot-1"]);
  });
});
