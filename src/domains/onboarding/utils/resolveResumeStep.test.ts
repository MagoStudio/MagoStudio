import { OnboardingStep } from "@store/atoms/onboardingAtom";
import { describe, expect, test } from "vitest";

import { resolveResumeStep } from "./resolveResumeStep";

describe("resolveResumeStep", () => {
  test.each<OnboardingStep>([
    "upload",
    "generate-image",
    "select-image",
    "render"
  ])("a user who dropped at %s resumes at the upload step", (step) => {
    expect(resolveResumeStep(step)).toBe("upload");
  });

  test("a user who dropped at the questionnaire resumes at the questionnaire", () => {
    expect(resolveResumeStep("questionnaire")).toBe("questionnaire");
  });

  test("a completed user stays complete", () => {
    expect(resolveResumeStep("complete")).toBe("complete");
  });
});
