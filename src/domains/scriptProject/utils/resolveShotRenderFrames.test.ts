import { describe, expect, it } from "vitest";

import { resolveShotRenderFrames } from "./resolveShotRenderFrames";
import { snapShotSecondsToFrames } from "./snapShotFrames";

const PROJECT_SHOT_FRAMES = 73;

describe("resolveShotRenderFrames", () => {
  it("falls back to the project-wide length when the shot has none of its own", () => {
    expect(
      resolveShotRenderFrames({
        shotDurationSeconds: null,
        projectShotFrames: PROJECT_SHOT_FRAMES
      })
    ).toBe(PROJECT_SHOT_FRAMES);
  });

  it("falls back when the field is absent, as it is on a project cast before atomic shots", () => {
    expect(
      resolveShotRenderFrames({
        shotDurationSeconds: undefined,
        projectShotFrames: PROJECT_SHOT_FRAMES
      })
    ).toBe(PROJECT_SHOT_FRAMES);
  });

  it("snaps the shot's own duration to the grid the engine can actually render", () => {
    expect(
      resolveShotRenderFrames({
        shotDurationSeconds: 2.5,
        projectShotFrames: PROJECT_SHOT_FRAMES
      })
    ).toBe(snapShotSecondsToFrames(2.5));
  });

  it("gives two differently paced beats two different lengths", () => {
    const quietBeatFrames = resolveShotRenderFrames({
      shotDurationSeconds: 2,
      projectShotFrames: PROJECT_SHOT_FRAMES
    });
    const actionBeatFrames = resolveShotRenderFrames({
      shotDurationSeconds: 4,
      projectShotFrames: PROJECT_SHOT_FRAMES
    });

    expect(quietBeatFrames).toBeLessThan(actionBeatFrames);
  });

  it("ignores a non-positive duration rather than rendering an empty shot", () => {
    expect(
      resolveShotRenderFrames({
        shotDurationSeconds: 0,
        projectShotFrames: PROJECT_SHOT_FRAMES
      })
    ).toBe(PROJECT_SHOT_FRAMES);
  });
});
