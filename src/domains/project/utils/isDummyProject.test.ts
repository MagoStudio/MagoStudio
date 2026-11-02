import { Project } from "@schemas/project";
import { describe, expect, it } from "vitest";

import { isDummyProject } from "./isDummyProject";

const project = (name: string, description: string | null) =>
  ({ id: "project", name, description }) as Project;

describe("isDummyProject", () => {
  it("recognises a signed-in user's folder project by the user id alone", () => {
    expect(isDummyProject(project("user_1", null), "user_1")).toBe(true);
    expect(isDummyProject(project("Film", null), "user_1")).toBe(false);
  });

  it("recognises the offline folder project by its name and description", () => {
    expect(
      isDummyProject(project("local", "Folder dummy project"), "local")
    ).toBe(true);
  });

  it("keeps an offline user's own project named after the user id visible", () => {
    expect(isDummyProject(project("local", "My film"), "local")).toBe(false);
  });

  it("never matches without a user id", () => {
    expect(isDummyProject(project("user_1", null), undefined)).toBe(false);
  });
});
