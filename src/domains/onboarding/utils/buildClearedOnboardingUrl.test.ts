import { ROUTES } from "@config/constants";
import { describe, expect, it } from "vitest";

import { buildClearedOnboardingUrl } from "./buildClearedOnboardingUrl";

describe("buildClearedOnboardingUrl", () => {
  it("removes onboarding and forces tool=render-video while keeping other params", () => {
    const url = buildClearedOnboardingUrl(
      "/project",
      "onboarding=1&projectId=p&timelineId=t&tool=edit-frame"
    );

    expect(url).not.toContain("onboarding");
    expect(url).toContain("tool=render-video");
    expect(url).not.toContain("tool=edit-frame");
    expect(url).toContain("projectId=p");
    expect(url).toContain("timelineId=t");
  });

  it("forces tool=render-video even when tool is absent from search", () => {
    const url = buildClearedOnboardingUrl(
      "/project",
      "onboarding=1&projectId=p"
    );

    expect(url).toContain("tool=render-video");
  });

  it("returns ROUTES.PROJECT when search is empty and pathname is null", () => {
    const url = buildClearedOnboardingUrl(null, "");

    expect(url).toBe(ROUTES.PROJECT);
  });
});
