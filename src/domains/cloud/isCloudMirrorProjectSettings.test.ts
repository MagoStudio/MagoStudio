import { describe, expect, it } from "vitest";

import { isCloudMirrorProjectSettings } from "./isCloudMirrorProjectSettings";
import { toCloudMirrorProjectSettings } from "./toCloudMirrorProjectSettings";

describe("isCloudMirrorProjectSettings", () => {
  it("recognizes the settings a Cloud Mirror Project is created with", () => {
    expect(
      isCloudMirrorProjectSettings(toCloudMirrorProjectSettings("local-id"))
    ).toBe(true);
  });

  it("rejects ordinary cloud project settings", () => {
    expect(isCloudMirrorProjectSettings({ rangeMin: 0, rangeMax: 48 })).toBe(
      false
    );
  });

  it("rejects an empty or non-string marker", () => {
    expect(isCloudMirrorProjectSettings({ mirroredLocalProjectId: "" })).toBe(
      false
    );
    expect(isCloudMirrorProjectSettings({ mirroredLocalProjectId: 1 })).toBe(
      false
    );
  });

  it("rejects missing settings", () => {
    expect(isCloudMirrorProjectSettings(undefined)).toBe(false);
    expect(isCloudMirrorProjectSettings(null)).toBe(false);
  });
});
