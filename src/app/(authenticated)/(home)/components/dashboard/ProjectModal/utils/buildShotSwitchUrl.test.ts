import { describe, expect, it } from "vitest";

import { buildShotSwitchUrl } from "./buildShotSwitchUrl";

describe("buildShotSwitchUrl", () => {
  it("includes the projectId and timelineId", () => {
    const url = buildShotSwitchUrl("project-1", "shot-1", "mask");

    expect(url).toContain("projectId=project-1");
    expect(url).toContain("timelineId=shot-1");
  });

  it.each(["edit-frame", "mask", "upscale"] as const)(
    "preserves a valid tool: %s",
    (tool) => {
      const url = buildShotSwitchUrl("project-1", "shot-1", tool);

      expect(url).toContain(`tool=${tool}`);
    }
  );

  it.each([undefined, null, "", "not-a-real-tool"])(
    "defaults to render-video when tool is %p",
    (tool) => {
      const url = buildShotSwitchUrl("project-1", "shot-1", tool);

      expect(url).toContain("tool=render-video");
    }
  );
});
