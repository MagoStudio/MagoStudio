import { describe, expect, it } from "vitest";

import { resolveProjectTypeFromSearchParam } from "./resolveProjectTypeFromSearchParam";

describe("resolveProjectTypeFromSearchParam", () => {
  it.each(["timeline", "script_to_shots"] as const)(
    "keeps the known type %s",
    (projectType) => {
      expect(resolveProjectTypeFromSearchParam(projectType)).toBe(projectType);
    }
  );

  it("falls back to Video to Video when the parameter is missing", () => {
    expect(resolveProjectTypeFromSearchParam(null)).toBe("timeline");
  });

  it("falls back to Video to Video for an unknown type", () => {
    expect(resolveProjectTypeFromSearchParam("spreadsheet")).toBe("timeline");
  });
});
