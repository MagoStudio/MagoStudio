import { describe, expect, it } from "vitest";

import { canSceneDialogueBeAutoLinkedToVoices } from "./canSceneDialogueBeAutoLinkedToVoices";

const noScenesRendering = new Set<string>();

describe("canSceneDialogueBeAutoLinkedToVoices", () => {
  it("links an open scene", () => {
    expect(
      canSceneDialogueBeAutoLinkedToVoices(
        { timeline_id: "scene-1", dropped: false, locked: false },
        noScenesRendering
      )
    ).toBe(true);
  });

  it("leaves a dropped scene alone", () => {
    expect(
      canSceneDialogueBeAutoLinkedToVoices(
        { timeline_id: "scene-1", dropped: true, locked: false },
        noScenesRendering
      )
    ).toBe(false);
  });

  it("leaves a locked scene alone", () => {
    expect(
      canSceneDialogueBeAutoLinkedToVoices(
        { timeline_id: "scene-1", dropped: false, locked: true },
        noScenesRendering
      )
    ).toBe(false);
  });

  it("leaves a rendering scene alone", () => {
    expect(
      canSceneDialogueBeAutoLinkedToVoices(
        { timeline_id: "scene-1", dropped: false, locked: false },
        new Set(["scene-1"])
      )
    ).toBe(false);
  });
});
