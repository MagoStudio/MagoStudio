import { describe, expect, it } from "vitest";

import { queryKeys } from "@/queryKeys";

import { getIngestInvalidationKeys } from "./getIngestInvalidationKeys";

describe("getIngestInvalidationKeys", () => {
  it("invalidates the project, its timeline list, the homepage and the project list", () => {
    expect(getIngestInvalidationKeys("project-1")).toEqual([
      queryKeys.project.byId("project-1"),
      queryKeys.timelineList.byProjectId("project-1"),
      queryKeys.homepage.all,
      queryKeys.projectList.all
    ]);
  });

  it("scopes the project-specific keys to the given project", () => {
    const [projectKey, timelineListKey] =
      getIngestInvalidationKeys("project-2");

    expect(projectKey).toContain("project-2");
    expect(timelineListKey).toContain("project-2");
  });
});
