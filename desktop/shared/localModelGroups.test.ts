import { describe, expect, it } from "vitest";

import { LOCAL_SCRIPT_TEXT_MODELS } from "./contracts";
import {
  ALWAYS_INSTALLED_MODEL_GROUP_IDS,
  allBundleIdsOfModelGroup,
  findLocalModelGroup,
  hardwareVariantLabel,
  isModelGroupAlwaysInstalled,
  LOCAL_MODEL_GROUPS,
  pickHardwareVariantForVideoMemory,
  resolveModelGroupBundles,
  resolveSelectedHardwareVariant,
  SCRIPT_TEXT_MODEL_GROUP_ID
} from "./localModelGroups";
import { LOCAL_MODEL_BUNDLES, requiredBundles } from "./localModelManifest";
import { LOCAL_NODE_PACK_PINS } from "./localNodePackPins";

const GIB = 1_073_741_824;

describe("local model groups", () => {
  it("puts every manifest bundle in exactly one group", () => {
    for (const bundle of LOCAL_MODEL_BUNDLES)
      expect(
        LOCAL_MODEL_GROUPS.filter((group) =>
          allBundleIdsOfModelGroup(group).includes(bundle.id)
        )
      ).toHaveLength(1);
  });

  it("makes Minimal exactly the bundles the starter install always required", () => {
    expect(resolveModelGroupBundles("minimal", {})).toEqual(
      requiredBundles(LOCAL_MODEL_BUNDLES)
    );
  });

  it("always installs Minimal only", () => {
    expect(ALWAYS_INSTALLED_MODEL_GROUP_IDS).toEqual(["minimal"]);
  });

  it("gives every hardware-variant group a variant that fits any machine", () => {
    for (const { hardwareVariants } of LOCAL_MODEL_GROUPS) {
      if (!hardwareVariants) continue;
      expect(
        hardwareVariants.some(
          (variant) => variant.minimumVideoMemoryGigabytes === 0
        )
      ).toBe(true);
      expect(() =>
        pickHardwareVariantForVideoMemory(hardwareVariants, null)
      ).not.toThrow();
    }
  });

  it("gives every hardware-variant group a default that is one of its variants", () => {
    for (const group of LOCAL_MODEL_GROUPS) {
      if (!group.hardwareVariants) continue;
      expect(group.hardwareVariants.map((variant) => variant.id)).toContain(
        group.defaultHardwareVariantId
      );
    }
  });

  it("makes the script text models exactly the Local LLM variants", () => {
    expect(
      findLocalModelGroup(SCRIPT_TEXT_MODEL_GROUP_ID).hardwareVariants?.map(
        (variant) => variant.id
      )
    ).toEqual(expect.arrayContaining([...LOCAL_SCRIPT_TEXT_MODELS]));
    expect(
      findLocalModelGroup(SCRIPT_TEXT_MODEL_GROUP_ID).hardwareVariants
    ).toHaveLength(LOCAL_SCRIPT_TEXT_MODELS.length);
  });

  it("falls back to the group default for an unknown saved variant", () => {
    expect(
      resolveSelectedHardwareVariant(findLocalModelGroup("local-llm"), {
        "local-llm": "removed-variant"
      })?.id
    ).toBe("qwen38-27b-q5");
    expect(
      resolveSelectedHardwareVariant(findLocalModelGroup("qwen-image"), {})
    ).toBeNull();
  });

  it("gives each hardware variant of a group its own video memory minimum", () => {
    for (const { hardwareVariants } of LOCAL_MODEL_GROUPS) {
      if (!hardwareVariants) continue;
      const minimums = hardwareVariants.map(
        (variant) => variant.minimumVideoMemoryGigabytes
      );
      expect(new Set(minimums).size).toBe(minimums.length);
    }
  });

  it("says whether a group is always installed", () => {
    expect(isModelGroupAlwaysInstalled("minimal")).toBe(true);
    expect(isModelGroupAlwaysInstalled("qwen-image")).toBe(false);
  });

  it("pins every node pack a group installs", () => {
    for (const group of LOCAL_MODEL_GROUPS)
      for (const nodePack of group.nodePacks)
        expect(LOCAL_NODE_PACK_PINS[nodePack.repositoryUrl]).toBeDefined();
  });

  it("installs only the Local LLM variant saved in Settings", () => {
    expect(
      resolveModelGroupBundles("local-llm", {
        "local-llm": "qwen38-27b-q3"
      }).map((bundle) => bundle.id)
    ).toEqual(["local-llm-q3"]);
  });

  it("labels the Local LLM variants Q3 and Q5", () => {
    expect(hardwareVariantLabel("local-llm", "qwen38-27b-q3")).toBe("Q3");
    expect(hardwareVariantLabel("local-llm", "qwen38-27b-q5")).toBe("Q5");
  });

  it("picks Q5 from 24 GB of video memory and Q3 below it or when unknown", () => {
    const localLlmHardwareVariants =
      findLocalModelGroup("local-llm").hardwareVariants ?? [];
    const pickLocalLlmVariant = (videoMemoryBytes: number | null) =>
      pickHardwareVariantForVideoMemory(
        localLlmHardwareVariants,
        videoMemoryBytes
      );
    expect(pickLocalLlmVariant(24 * GIB)).toBe("qwen38-27b-q5");
    expect(pickLocalLlmVariant(24_564 * 1_048_576)).toBe("qwen38-27b-q5");
    expect(pickLocalLlmVariant(16 * GIB)).toBe("qwen38-27b-q3");
    expect(pickLocalLlmVariant(null)).toBe("qwen38-27b-q3");
  });
});
