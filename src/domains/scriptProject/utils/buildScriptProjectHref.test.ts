import { describe, expect, it } from "vitest";

import { buildScriptProjectHref } from "./buildScriptProjectHref";

describe("buildScriptProjectHref", () => {
  it("points at the script project route with the project id", () => {
    expect(buildScriptProjectHref("p1")).toBe("/script-project?projectId=p1");
  });

  it("escapes an id that would otherwise break the query string", () => {
    expect(buildScriptProjectHref("a b&c")).toBe(
      "/script-project?projectId=a%20b%26c"
    );
  });
});
