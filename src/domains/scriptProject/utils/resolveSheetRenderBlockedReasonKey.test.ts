import { describe, expect, it } from "vitest";

import { resolveSheetRenderBlockedReasonKey } from "./resolveSheetRenderBlockedReasonKey";

describe("resolveSheetRenderBlockedReasonKey", () => {
  it("names an upload in progress first", () => {
    expect(
      resolveSheetRenderBlockedReasonKey({
        isRunActive: true,
        isUploadingReference: true
      })
    ).toBe("script_project.render_blocked_reference_uploading.label");
  });

  it("names the active run", () => {
    expect(
      resolveSheetRenderBlockedReasonKey({
        isRunActive: true,
        isUploadingReference: false
      })
    ).toBe("script_project.render_blocked_run_active.label");
  });

  it("names nothing when nothing blocks the render", () => {
    expect(
      resolveSheetRenderBlockedReasonKey({
        isRunActive: false,
        isUploadingReference: false
      })
    ).toBe(null);
  });
});
