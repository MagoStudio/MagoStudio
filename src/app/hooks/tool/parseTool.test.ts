import { describe, expect, it } from "vitest";

import { DEFAULT_TOOL, parseTool } from "./parseTool";

describe("parseTool", () => {
  it("returns the value when it is a valid tool", () => {
    expect(parseTool("render-video")).toBe("render-video");
    expect(parseTool("mask")).toBe("mask");
    expect(parseTool("edit-frame")).toBe("edit-frame");
    expect(parseTool("upscale")).toBe("upscale");
    expect(parseTool("image-to-video")).toBe("image-to-video");
  });

  it("returns the default tool when the value is invalid", () => {
    expect(parseTool("global-timeline")).toBe(DEFAULT_TOOL);
    expect(parseTool("unknown")).toBe(DEFAULT_TOOL);
    expect(parseTool("")).toBe(DEFAULT_TOOL);
  });

  it("returns the default tool when the value is null or undefined", () => {
    expect(parseTool(null)).toBe(DEFAULT_TOOL);
    expect(parseTool(undefined)).toBe(DEFAULT_TOOL);
  });
});
