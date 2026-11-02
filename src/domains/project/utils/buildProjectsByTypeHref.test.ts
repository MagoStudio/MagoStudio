import { describe, expect, it } from "vitest";

import { buildProjectsByTypeHref } from "./buildProjectsByTypeHref";

describe("buildProjectsByTypeHref", () => {
  it.each([
    ["timeline", "/projects/?type=timeline"],
    ["script_to_shots", "/projects/?type=script_to_shots"]
  ] as const)("lists the %s projects", (projectType, expectedHref) => {
    expect(buildProjectsByTypeHref(projectType)).toBe(expectedHref);
  });
});
