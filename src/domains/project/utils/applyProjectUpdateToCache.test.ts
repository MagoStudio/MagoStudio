import { Project } from "@schemas/project";
import { describe, expect, it } from "vitest";

import { applyProjectUpdateToCache } from "./applyProjectUpdateToCache";

const baseProject: Project = {
  id: "p1",
  name: "Old Name",
  description: "old description",
  active: true,
  type: "timeline",
  settings: { rangeMin: 0, rangeMax: 120 }
};

const baseVariables = {
  projectId: "p1",
  projectName: "New Name",
  projectDescription: "new description"
};

describe("applyProjectUpdateToCache", () => {
  it("preserves existing settings when the update omits settings", () => {
    const result = applyProjectUpdateToCache(baseProject, baseVariables);

    expect(result?.settings).toEqual({ rangeMin: 0, rangeMax: 120 });
  });

  it("replaces settings when the update provides them", () => {
    const result = applyProjectUpdateToCache(baseProject, {
      ...baseVariables,
      settings: { rangeMin: 5, rangeMax: 90, pinnedTrackIds: { s1: "l1" } }
    });

    expect(result?.settings).toEqual({
      rangeMin: 5,
      rangeMax: 90,
      pinnedTrackIds: { s1: "l1" }
    });
  });

  it("always updates name and description from the variables", () => {
    const result = applyProjectUpdateToCache(baseProject, baseVariables);

    expect(result?.name).toBe("New Name");
    expect(result?.description).toBe("new description");
  });

  it("preserves unrelated project fields", () => {
    const result = applyProjectUpdateToCache(
      { ...baseProject, shared_group_id: "g1" },
      baseVariables
    );

    expect(result?.id).toBe("p1");
    expect(result?.shared_group_id).toBe("g1");
  });

  it("returns undefined when there is no cached project", () => {
    expect(applyProjectUpdateToCache(undefined, baseVariables)).toBeUndefined();
  });
});
