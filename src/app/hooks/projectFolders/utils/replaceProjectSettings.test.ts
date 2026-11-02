import { Project } from "@schemas/project";
import { describe, expect, it } from "vitest";

import { replaceProjectSettings } from "./replaceProjectSettings";

const project = (id: string, folders: unknown[]): Project =>
  ({ id, name: id, settings: { folders } }) as unknown as Project;

describe("replaceProjectSettings", () => {
  it("replaces the settings of the project with the given id only", () => {
    const projects = [project("a", []), project("b", [])];
    const settings = { folders: ["x"] } as unknown as Project["settings"];

    const result = replaceProjectSettings(projects, "b", settings);

    expect(result?.[0]).toBe(projects[0]);
    expect(result?.[1]).toEqual({ ...projects[1], settings });
  });

  it("leaves an empty cache empty", () => {
    expect(
      replaceProjectSettings(undefined, "a", {} as Project["settings"])
    ).toBeUndefined();
  });
});
