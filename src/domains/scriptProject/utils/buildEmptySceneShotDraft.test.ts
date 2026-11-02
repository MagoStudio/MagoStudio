import { describe, expect, it } from "vitest";

import { buildEmptySceneShotDraft } from "./buildEmptySceneShotDraft";

describe("buildEmptySceneShotDraft", () => {
  it("starts empty except a static camera and medium close-up framing", () => {
    expect(buildEmptySceneShotDraft("draft-1")).toEqual({
      draftId: "draft-1",
      durationSeconds: "",
      cameraMovement: "Static",
      framing: "Medium close-up",
      description: "",
      dialogue: ""
    });
  });
});
