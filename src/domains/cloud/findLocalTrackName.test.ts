import { describe, expect, it } from "vitest";

import { findLocalTrackName } from "./findLocalTrackName";

const PROJECTS = [
  {
    id: "p1",
    timelines: [
      {
        id: "s1",
        layers: [
          { id: "input", name: "clip" },
          { id: "output", name: "clip_Upscale (2)" },
          { id: "unnamed", name: "" }
        ]
      }
    ]
  }
];

describe("findLocalTrackName", () => {
  it("returns the name of the track with that id", () => {
    expect(findLocalTrackName(PROJECTS, "output")).toBe("clip_Upscale (2)");
  });

  it("returns null for an unknown or unnamed track", () => {
    expect(findLocalTrackName(PROJECTS, "missing")).toBeNull();
    expect(findLocalTrackName(PROJECTS, "unnamed")).toBeNull();
  });

  it("tolerates a malformed tree", () => {
    expect(findLocalTrackName(null, "output")).toBeNull();
    expect(findLocalTrackName([{ timelines: "x" }], "output")).toBeNull();
  });
});
