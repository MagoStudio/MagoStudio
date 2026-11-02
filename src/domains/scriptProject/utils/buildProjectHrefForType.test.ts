import { describe, expect, it } from "vitest";

import { buildProjectHrefForType } from "./buildProjectHrefForType";

describe("buildProjectHrefForType", () => {
  it("sends a script-to-shots project to the four-tab UI", () => {
    expect(buildProjectHrefForType("p1", "script_to_shots")).toBe(
      "/script-project?projectId=p1"
    );
  });

  it("sends a timeline project to the editor", () => {
    expect(buildProjectHrefForType("p1", "timeline")).toBe(
      "/project?projectId=p1"
    );
  });
});
