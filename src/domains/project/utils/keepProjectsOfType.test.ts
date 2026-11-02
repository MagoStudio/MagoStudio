import { describe, expect, it } from "vitest";

import { keepProjectsOfType } from "./keepProjectsOfType";

const projects = [
  { id: "video", type: "timeline" as const },
  { id: "script", type: "script_to_shots" as const }
];

describe("keepProjectsOfType", () => {
  it("keeps only the requested type, even when the backend sent every type", () => {
    expect(keepProjectsOfType(projects, "script_to_shots")).toEqual([
      { id: "script", type: "script_to_shots" }
    ]);
  });

  it("keeps every project when no type is requested", () => {
    expect(keepProjectsOfType(projects, undefined)).toEqual(projects);
  });
});
