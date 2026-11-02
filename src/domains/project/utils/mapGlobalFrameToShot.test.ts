import { describe, expect, it } from "vitest";

import { mapGlobalFrameToShot } from "./mapGlobalFrameToShot";

describe("mapGlobalFrameToShot", () => {
  it("returns default for empty arrays", () => {
    const result = mapGlobalFrameToShot(50, [], []);
    expect(result).toEqual({ shotIndex: 0, localFrame: 0 });
  });

  it("maps frame 0 to first shot, local frame 0", () => {
    const result = mapGlobalFrameToShot(0, [0, 100, 250], [100, 150, 200]);
    expect(result).toEqual({ shotIndex: 0, localFrame: 0 });
  });

  it("maps frame in middle of first shot", () => {
    const result = mapGlobalFrameToShot(50, [0, 100, 250], [100, 150, 200]);
    expect(result).toEqual({ shotIndex: 0, localFrame: 50 });
  });

  it("maps frame at boundary to next shot, local frame 0", () => {
    const result = mapGlobalFrameToShot(100, [0, 100, 250], [100, 150, 200]);
    expect(result).toEqual({ shotIndex: 1, localFrame: 0 });
  });

  it("maps frame in middle of second shot", () => {
    const result = mapGlobalFrameToShot(150, [0, 100, 250], [100, 150, 200]);
    expect(result).toEqual({ shotIndex: 1, localFrame: 50 });
  });

  it("maps frame at second boundary", () => {
    const result = mapGlobalFrameToShot(250, [0, 100, 250], [100, 150, 200]);
    expect(result).toEqual({ shotIndex: 2, localFrame: 0 });
  });

  it("maps frame at end of last shot", () => {
    const result = mapGlobalFrameToShot(449, [0, 100, 250], [100, 150, 200]);
    expect(result).toEqual({ shotIndex: 2, localFrame: 199 });
  });

  it("clamps frame beyond total duration to last frame of last shot", () => {
    const result = mapGlobalFrameToShot(999, [0, 100, 250], [100, 150, 200]);
    expect(result).toEqual({ shotIndex: 2, localFrame: 199 });
  });

  it("clamps negative frame to 0", () => {
    const result = mapGlobalFrameToShot(-10, [0, 100], [100, 200]);
    expect(result).toEqual({ shotIndex: 0, localFrame: 0 });
  });

  it("handles single shot", () => {
    const result = mapGlobalFrameToShot(75, [0], [200]);
    expect(result).toEqual({ shotIndex: 0, localFrame: 75 });
  });

  it("handles single shot at end", () => {
    const result = mapGlobalFrameToShot(199, [0], [200]);
    expect(result).toEqual({ shotIndex: 0, localFrame: 199 });
  });
});
