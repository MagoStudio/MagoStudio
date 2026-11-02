import { describe, expect, it } from "vitest";

import { localSheetModelInstallRequirement } from "./localSheetModelInstallRequirement";

describe("localSheetModelInstallRequirement", () => {
  it("maps the wizard-installable sheet models to their model group", () => {
    expect(
      localSheetModelInstallRequirement("qwen_image_2512_local").modelGroupId
    ).toBe("qwen-image");
    expect(
      localSheetModelInstallRequirement("flux2_klein_4b_q8_local").modelGroupId
    ).toBe("flux-image");
  });

  it("leaves Flux 2 Klein 9B to the per-file download", () => {
    expect(
      localSheetModelInstallRequirement("flux2_klein_9b_q8_local")
    ).toEqual({
      modelGroupId: null,
      optionalScriptSetupId: "flux-klein-9b-sheet"
    });
  });
});
