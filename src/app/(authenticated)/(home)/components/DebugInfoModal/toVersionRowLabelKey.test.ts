import { describe, expect, it } from "vitest";

import { toVersionRowLabelKey } from "./toVersionRowLabelKey";

describe("toVersionRowLabelKey", () => {
  it("labels the version as the app version in the local app", () => {
    expect(toVersionRowLabelKey(true)).toBe("titles.app_version.label");
  });

  it("labels the version as the backend version in the web app", () => {
    expect(toVersionRowLabelKey(false)).toBe("titles.backend_version.label");
  });
});
