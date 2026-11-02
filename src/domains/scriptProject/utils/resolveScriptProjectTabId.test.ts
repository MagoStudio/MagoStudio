import { describe, expect, it } from "vitest";

import { resolveScriptProjectTabId } from "./resolveScriptProjectTabId";

describe("resolveScriptProjectTabId", () => {
  it("keeps a known tab id", () => {
    expect(resolveScriptProjectTabId("storyboard")).toBe("storyboard");
    expect(resolveScriptProjectTabId("shots")).toBe("shots");
    expect(resolveScriptProjectTabId("timeline")).toBe("timeline");
  });

  it("falls back to the script tab for an unknown id", () => {
    expect(resolveScriptProjectTabId("renders")).toBe("script");
  });

  it("falls back to the script tab when the param is absent", () => {
    expect(resolveScriptProjectTabId(null)).toBe("script");
    expect(resolveScriptProjectTabId(undefined)).toBe("script");
    expect(resolveScriptProjectTabId("")).toBe("script");
  });
});
