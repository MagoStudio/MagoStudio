import { describe, expect, it } from "vitest";

import { img2imgStatus } from "./render";
import {
  projectState,
  scriptChatMessages,
  sheetImageInputs
} from "./scriptProject";

describe("script project query keys", () => {
  it("nests the dry-run keys under the project state key, so one invalidation covers both", () => {
    const projectStateKey = projectState.byProjectId("p1");

    for (const dryRunKey of [
      projectState.sheetsDryRun("p1"),
      projectState.shotsDryRun("p1"),
      projectState.upscaleDryRun("p1")
    ]) {
      expect(dryRunKey.slice(0, projectStateKey.length)).toEqual(
        projectStateKey
      );
    }
  });

  it("gives each dry-run parameter set its own key, so one entry cannot serve two requests", () => {
    const threeSecondShots = projectState.shotsDryRun("p1", [1280, 720], {
      frame_range: [0, 72]
    });
    const eightSecondShots = projectState.shotsDryRun("p1", [1280, 720], {
      frame_range: [0, 192]
    });

    expect(threeSecondShots).not.toEqual(eightSecondShots);
  });

  it("keeps sheet image inputs off the Img2Img status key", () => {
    expect(sheetImageInputs.byClipId("clip-1")).not.toEqual(
      img2imgStatus.byClipId("clip-1")
    );
  });

  it("gives each project its own script chat messages key", () => {
    expect(scriptChatMessages.byProjectId("p1")).not.toEqual(
      scriptChatMessages.byProjectId("p2")
    );
  });
});
