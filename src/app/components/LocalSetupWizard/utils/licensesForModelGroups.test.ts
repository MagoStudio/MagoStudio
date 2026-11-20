import { describe, expect, it } from "vitest";

import { licensesForModelGroups } from "./licensesForModelGroups";

const reposOf = (licenses: ReturnType<typeof licensesForModelGroups>) =>
  licenses.map((license) => license.huggingFaceRepo);

describe("licensesForModelGroups", () => {
  it("lists the MiniMax H3 licenses for the minimal group", () => {
    expect(reposOf(licensesForModelGroups(["minimal"]))).toEqual(
      expect.arrayContaining([
        "Comfy-Org/MiniMax-H3",
        "alibaba-pai/MiniMax-H3-Acc-LoRAs"
      ])
    );
  });

  it("lists only permissive licenses for Flux Image", () => {
    const fluxLicenses = licensesForModelGroups(["flux-image"]);
    expect(fluxLicenses.length).toBeGreaterThan(0);
    expect(fluxLicenses.every((license) => license.isPermissiveLicense)).toBe(
      true
    );
  });

  it("asks for the crossview LoRA license only when New camera angle is chosen", () => {
    const crossviewRepo = "Cseti/MiniMax-H3_Ref2VA-LoRA-CrossView-Warp_v1";
    expect(reposOf(licensesForModelGroups(["minimal"]))).not.toContain(
      crossviewRepo
    );
    expect(
      reposOf(licensesForModelGroups(["minimal", "minimax-h3-crossview"]))
    ).toContain(crossviewRepo);
  });

  it("leaves out licenses of groups that were not chosen", () => {
    expect(reposOf(licensesForModelGroups(["qwen-image"]))).not.toContain(
      "Comfy-Org/MiniMax-H3"
    );
  });
});
