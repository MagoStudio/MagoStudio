import { describe, expect, it } from "vitest";

import { resolveSheetRenderPrompt } from "./resolveSheetRenderPrompt";

describe("resolveSheetRenderPrompt", () => {
  it("uses the render prompt when there is one", () => {
    expect(
      resolveSheetRenderPrompt({
        prompt: "full-body, neutral pose",
        description: "weathered, 40s",
        token: "sergeant"
      })
    ).toBe("full-body, neutral pose");
  });

  it("falls back to the description when the prompt is empty", () => {
    expect(
      resolveSheetRenderPrompt({
        prompt: "",
        description: "weathered, 40s",
        token: "sergeant"
      })
    ).toBe("weathered, 40s");
  });

  it("treats a whitespace-only prompt as empty, as the backend does", () => {
    expect(
      resolveSheetRenderPrompt({
        prompt: "   ",
        description: "weathered, 40s",
        token: "sergeant"
      })
    ).toBe("weathered, 40s");
  });

  it("falls back to the token when both are empty", () => {
    expect(
      resolveSheetRenderPrompt({
        prompt: null,
        description: null,
        token: "sergeant"
      })
    ).toBe("sergeant");
  });
});
