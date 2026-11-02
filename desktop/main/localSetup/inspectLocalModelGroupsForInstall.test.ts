import { describe, expect, it, vi } from "vitest";

import type { SelectedModelGroupVariants } from "../../shared/localModelGroups";

import { inspectLocalModelGroupsForInstall } from "./inspectLocalModelGroupsForInstall";

const GIB = 1_073_741_824;

const settingsWith = ({
  savedModelGroupVariants,
  installedModelGroups = {}
}: {
  savedModelGroupVariants: SelectedModelGroupVariants;
  installedModelGroups?: Record<string, string[]>;
}) => ({
  getLocalModelsRoot: async () => null,
  getSelectedModelGroupVariants: async () => savedModelGroupVariants,
  getInstalledModelGroups: async () => installedModelGroups,
  recordInstalledModelGroup: vi.fn(async () => {})
});

const localLlmMissingFileNames = (
  inspection: Awaited<ReturnType<typeof inspectLocalModelGroupsForInstall>>
) =>
  inspection.groups
    .find((group) => group.groupId === "local-llm")
    ?.missingItems.map((item) => item.name)
    .join();

describe("inspectLocalModelGroupsForInstall", () => {
  it("measures a not-installed Local LLM at the variant this machine will get", async () => {
    const settings = settingsWith({
      savedModelGroupVariants: { "local-llm": "qwen38-27b-q5" }
    });
    const inspection = await inspectLocalModelGroupsForInstall(
      settings,
      async () => 16 * GIB
    );
    expect(inspection.selectedModelGroupVariantsForInstall).toEqual({
      "local-llm": "qwen38-27b-q3"
    });
    expect(inspection.hardwareVariantGroupIdsPickedForInstall).toEqual([
      "local-llm"
    ]);
    expect(localLlmMissingFileNames(inspection)).toContain("Q3");
    expect(settings.recordInstalledModelGroup).not.toHaveBeenCalled();
  });

  it("keeps the saved variant of a Local LLM that is already recorded", async () => {
    const readVideoMemoryBytes = vi.fn(async () => 16 * GIB);
    const inspection = await inspectLocalModelGroupsForInstall(
      settingsWith({
        savedModelGroupVariants: { "local-llm": "qwen38-27b-q5" },
        installedModelGroups: { "local-llm": [] }
      }),
      readVideoMemoryBytes
    );
    expect(inspection.selectedModelGroupVariantsForInstall).toEqual({
      "local-llm": "qwen38-27b-q5"
    });
    expect(inspection.hardwareVariantGroupIdsPickedForInstall).toEqual([]);
    expect(readVideoMemoryBytes).not.toHaveBeenCalled();
  });
});
