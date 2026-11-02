import { VideoEngine } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { getVideoModelByEngine } from "./getVideoModelByEngine";

describe("getVideoModelByEngine", () => {
  it("resolves a known engine to its model definition", () => {
    expect(getVideoModelByEngine(VideoEngine.V3_4_0)?.name).toBe(
      VideoEngine.V3_4_0
    );
  });

  it("resolves an engine passed as a raw string", () => {
    expect(getVideoModelByEngine("v3.4.0")?.name).toBe(VideoEngine.V3_4_0);
  });

  it("returns undefined for an unknown engine", () => {
    expect(getVideoModelByEngine("unknown_engine")).toBeUndefined();
  });

  it("returns undefined for undefined", () => {
    expect(getVideoModelByEngine(undefined)).toBeUndefined();
  });
});
