import { describe, expect, it } from "vitest";

import { API_URL } from "@/lib/backend-api-client";

import { getAmplitudeAutocaptureOptions } from "./getAmplitudeAutocaptureOptions";

const LONG_FORM_RUN_URL =
  "https://app.mago.studio/long-form/80bee85d-abd9-459d-a423-754447d75da0";
const NORMAL_PROJECT_URL = "https://app.mago.studio/project?projectId=abc";

describe("getAmplitudeAutocaptureOptions", () => {
  it("excludes a long-form run URL from click capture and accepts a normal path", () => {
    const { elementInteractions } = getAmplitudeAutocaptureOptions();
    const [excludePattern] = elementInteractions.pageUrlExcludelist;

    expect(excludePattern.test(LONG_FORM_RUN_URL)).toBe(true);
    expect(excludePattern.test(NORMAL_PROJECT_URL)).toBe(false);
  });

  it("excludes a long-form run URL from frustration capture and accepts a normal path", () => {
    const { frustrationInteractions } = getAmplitudeAutocaptureOptions();
    const [excludePattern] = frustrationInteractions.pageUrlExcludelist;

    expect(excludePattern.test(LONG_FORM_RUN_URL)).toBe(true);
    expect(excludePattern.test(NORMAL_PROJECT_URL)).toBe(false);
  });

  it("restricts network capture to the backend API host", () => {
    const { networkTracking } = getAmplitudeAutocaptureOptions();

    expect(networkTracking.captureRules).toEqual([
      { hosts: [new URL(API_URL).hostname] }
    ]);
  });
});
