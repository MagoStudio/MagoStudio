import { ROUTES } from "@config/constants";
import { describe, expect, it } from "vitest";

import { buildShotRenderVideoUrl } from "./buildShotRenderVideoUrl";

describe("buildShotRenderVideoUrl", () => {
  it("builds a project URL for the shot on the render-video tab", () => {
    expect(buildShotRenderVideoUrl("p1", "s1")).toBe(
      `${ROUTES.PROJECT}?projectId=p1&timelineId=s1&tool=render-video`
    );
  });

  it("always targets the render-video tab", () => {
    expect(buildShotRenderVideoUrl("abc", "def")).toContain(
      "tool=render-video"
    );
  });

  it("sets the shot id on the timelineId param", () => {
    expect(buildShotRenderVideoUrl("proj-123", "shot-456")).toContain(
      "timelineId=shot-456"
    );
  });
});
