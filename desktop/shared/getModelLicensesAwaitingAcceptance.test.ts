import { describe, expect, it } from "vitest";

import { getModelLicensesAwaitingAcceptance } from "./getModelLicensesAwaitingAcceptance";
import type { LocalModelLicense } from "./localModelLicenses";

const restrictiveModel = (huggingFaceRepo: string): LocalModelLicense => ({
  modelName: huggingFaceRepo,
  huggingFaceRepo,
  licenseName: "Community License",
  licenseUrl: `https://example.com/${huggingFaceRepo}`,
  isPermissiveLicense: false
});
const permissiveModel: LocalModelLicense = {
  ...restrictiveModel("org/permissive"),
  isPermissiveLicense: true
};

describe("getModelLicensesAwaitingAcceptance", () => {
  const first = restrictiveModel("org/first");
  const second = restrictiveModel("org/second");
  const catalog = [first, permissiveModel, second];

  it("lists every restrictive license when nothing was accepted", () => {
    expect(getModelLicensesAwaitingAcceptance([], catalog)).toEqual([
      first,
      second
    ]);
  });

  it("never lists permissive licenses", () => {
    expect(getModelLicensesAwaitingAcceptance([], [permissiveModel])).toEqual(
      []
    );
  });

  it("lists only the restrictive licenses added since the last acceptance", () => {
    expect(getModelLicensesAwaitingAcceptance(["org/first"], catalog)).toEqual([
      second
    ]);
  });

  it("lists nothing once every restrictive license was accepted", () => {
    expect(
      getModelLicensesAwaitingAcceptance(["org/first", "org/second"], catalog)
    ).toEqual([]);
  });

  it("ignores accepted repos that are no longer in the catalog", () => {
    expect(
      getModelLicensesAwaitingAcceptance(["org/removed", "org/first"], catalog)
    ).toEqual([second]);
  });

  it("covers the real catalog: the MiniMax H3 and Flux 2 Klein 9B licenses are awaiting acceptance on a fresh install", () => {
    expect(
      getModelLicensesAwaitingAcceptance([]).map(
        (license) => license.huggingFaceRepo
      )
    ).toEqual([
      "Comfy-Org/MiniMax-H3",
      "Pika-Labs/Pika-H3-Flex-Turbo-LoRA",
      "Alissonerdx/Minimax-H3-ComfyUI",
      "akatz-ai/MiniMax-H3-Character-Swap-LoRA",
      "unsloth/FLUX.2-klein-9B-GGUF",
      "Comfy-Org/vae-text-encorder-for-flux-klein-9b"
    ]);
  });
});
