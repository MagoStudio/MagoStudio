import { ProjectStateSchema } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { describeSceneStoryboardFromBackend } from "./describeSceneStoryboardFromBackend";

const summaryOf = (storyboard: Record<string, unknown>) =>
  ProjectStateSchema.parse({
    project_id: "project",
    keys: [],
    shots: [{ timeline_id: "scene", shot_index: 0, sequence_id: 1, storyboard }]
  }).shots[0]!.storyboard!;

describe("describeSceneStoryboardFromBackend", () => {
  it("keeps showing the version in use when the newest attempt failed", () => {
    const view = describeSceneStoryboardFromBackend(
      summaryOf({
        status: "ready",
        image_url: "https://cdn.example/v1.png",
        last_attempt_failed: true,
        version_count: 2
      })
    );
    expect(view).toMatchObject({
      imageUrl: "https://cdn.example/v1.png",
      hasNoUsableVersion: false,
      hasLastAttemptFailed: true,
      versionCount: 2
    });
  });

  it("reads a stale or switched-off storyboard as not reaching the video", () => {
    expect(
      describeSceneStoryboardFromBackend(
        summaryOf({ status: "stale", enabled: false })
      )
    ).toMatchObject({ isStale: true, isUsedInVideoRenders: false });
  });

  it("caps a drawn storyboard at 15 shots", () => {
    expect(
      describeSceneStoryboardFromBackend(summaryOf({})).maxShotCountToDraw
    ).toBe(15);
  });

  it("only hints at a failed last attempt while a current version is sent", () => {
    const lastAttemptFailedWith = (overrides: Record<string, unknown>) =>
      describeSceneStoryboardFromBackend(
        summaryOf({ last_attempt_failed: true, ...overrides })
      ).hasLastAttemptFailed;

    expect(lastAttemptFailedWith({ status: "ready" })).toBe(true);
    expect(lastAttemptFailedWith({ status: "failed" })).toBe(false);
    expect(lastAttemptFailedWith({ status: "stale" })).toBe(false);
    expect(lastAttemptFailedWith({ status: "ready", enabled: false })).toBe(
      false
    );
  });
});
