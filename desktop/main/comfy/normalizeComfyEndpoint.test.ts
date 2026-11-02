import { describe, expect, it } from "vitest";

import { normalizeComfyEndpoint } from "./normalizeComfyEndpoint";

describe("normalizeComfyEndpoint", () => {
  it("normalizes an http(s) Comfy endpoint", () => {
    expect(normalizeComfyEndpoint(" http://127.0.0.1:8188/ ")).toBe(
      "http://127.0.0.1:8188"
    );
    expect(normalizeComfyEndpoint("https://comfy.example/api/")).toBe(
      "https://comfy.example/api"
    );
  });

  it("rejects unsafe endpoint schemes and embedded credentials", () => {
    expect(() => normalizeComfyEndpoint("file:///tmp/comfy")).toThrow(
      "http or https"
    );
    expect(() =>
      normalizeComfyEndpoint("https://user:secret@comfy.example")
    ).toThrow("cannot contain credentials");
  });
});
