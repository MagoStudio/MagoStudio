import { describe, expect, it } from "vitest";

import { hasOnboardingRenderInQueue } from "./hasOnboardingRenderInQueue";

const queueItem = (projectName: string, projectId = `id-${projectName}`) => ({
  project_name: projectName,
  project_id: projectId
});

describe("hasOnboardingRenderInQueue", () => {
  it("matches an item on the base Onboarding project", () => {
    expect(hasOnboardingRenderInQueue([queueItem("Onboarding")], [])).toBe(
      true
    );
  });

  it("matches an item on a suffixed Onboarding_N project", () => {
    expect(hasOnboardingRenderInQueue([queueItem("Onboarding_2")], [])).toBe(
      true
    );
  });

  it("ignores items on non-onboarding projects", () => {
    expect(
      hasOnboardingRenderInQueue(
        [queueItem("My project"), queueItem("Onboarding video test")],
        []
      )
    ).toBe(false);
  });

  it("ignores onboarding items whose project is in the reset baseline", () => {
    expect(
      hasOnboardingRenderInQueue(
        [queueItem("Onboarding", "old-run")],
        ["old-run"]
      )
    ).toBe(false);
  });

  it("still matches an onboarding item outside the reset baseline", () => {
    expect(
      hasOnboardingRenderInQueue(
        [
          queueItem("Onboarding", "old-run"),
          queueItem("Onboarding_1", "fresh")
        ],
        ["old-run"]
      )
    ).toBe(true);
  });

  it("counts items regardless of status (status is not part of the check)", () => {
    const errored = {
      ...queueItem("Onboarding"),
      status: "ERROR"
    };
    const inQueue = { ...queueItem("Onboarding_3"), status: "INQUEUE" };
    const finished = { ...queueItem("Onboarding_4"), status: "FINISHED" };
    expect(hasOnboardingRenderInQueue([errored], [])).toBe(true);
    expect(hasOnboardingRenderInQueue([inQueue], [])).toBe(true);
    expect(hasOnboardingRenderInQueue([finished], [])).toBe(true);
  });

  it("returns false for an empty queue", () => {
    expect(hasOnboardingRenderInQueue([], [])).toBe(false);
  });
});
