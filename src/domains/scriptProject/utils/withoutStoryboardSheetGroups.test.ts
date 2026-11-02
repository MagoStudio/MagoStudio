import { ProjectStateSchema } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { withoutStoryboardSheetGroups } from "./withoutStoryboardSheetGroups";

describe("withoutStoryboardSheetGroups", () => {
  it("leaves the scenes' storyboard assets out of the project's assets", () => {
    const projectState = ProjectStateSchema.parse({
      project_id: "project",
      keys: [
        { token: "HERO", name: "Hero", layer_id: "hero-layer" },
        {
          token: "storyboard_scene_1",
          name: "Storyboard",
          layer_id: "storyboard-layer"
        }
      ],
      shots: []
    });

    expect(
      withoutStoryboardSheetGroups(projectState).keys.map(
        (sheetGroup) => sheetGroup.token
      )
    ).toEqual(["HERO"]);
  });
});
