import { describe, expect, it } from "vitest";

import { resolveEndpointPort } from "./resolveEndpointPort";

describe("resolveEndpointPort", () => {
  it("returns the explicit port", () => {
    expect(resolveEndpointPort("http://127.0.0.1:8188")).toBe(8188);
  });

  it("falls back to the protocol default port", () => {
    expect(resolveEndpointPort("http://localhost")).toBe(80);
    expect(resolveEndpointPort("https://localhost")).toBe(443);
  });
});
