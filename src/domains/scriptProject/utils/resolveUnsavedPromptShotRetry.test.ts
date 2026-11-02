import { ShotState } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { resolveUnsavedPromptShotRetry } from "./resolveUnsavedPromptShotRetry";

const buildShot = (videoPrompt: string): ShotState =>
  ({ timeline_id: "shot-2", video_prompt: videoPrompt }) as ShotState;

const failedDraft = { videoPrompt: "Slow push, dusk", hasUnsavedPrompt: true };

describe("resolveUnsavedPromptShotRetry", () => {
  it("does not overwrite dialogue saved after a failed render preparation", () => {
    const dialogue = [{ line: "Newer saved line" }];
    const result = resolveUnsavedPromptShotRetry({
      failedShot: buildShot("Static wide"),
      failedDraft: {
        ...failedDraft,
        dialogue: [{ line: "Failed draft" }],
        hasUnsavedDialogue: true
      },
      latestShot: { ...buildShot("Static wide"), dialogue }
    });
    expect(result.draft).toMatchObject({ dialogue, hasUnsavedDialogue: false });
  });
  it("re-sends the draft that failed when nothing newer was saved", () => {
    expect(
      resolveUnsavedPromptShotRetry({
        failedShot: buildShot("Static wide"),
        failedDraft,
        latestShot: buildShot("Static wide")
      }).draft
    ).toEqual(failedDraft);
  });

  it("uses the newer saved prompt, with nothing left to save, when the user saved again since the failure", () => {
    const result = resolveUnsavedPromptShotRetry({
      failedShot: buildShot("Static wide"),
      failedDraft,
      latestShot: buildShot("Handheld, rain")
    });

    expect(result.draft).toEqual({
      videoPrompt: "Handheld, rain",
      hasUnsavedPrompt: false
    });
    expect(result.shot.video_prompt).toBe("Handheld, rain");
  });

  it("falls back to the failed Shot when it is no longer in the project", () => {
    const failedShot = buildShot("Static wide");

    expect(
      resolveUnsavedPromptShotRetry({
        failedShot,
        failedDraft,
        latestShot: undefined
      })
    ).toEqual({ shot: failedShot, draft: failedDraft });
  });
});
