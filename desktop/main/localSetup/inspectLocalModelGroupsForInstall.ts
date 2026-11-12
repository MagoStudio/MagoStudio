import {
  findLocalModelGroup,
  pickHardwareVariantForVideoMemory,
  type LocalModelGroupId,
  type SelectedModelGroupVariants
} from "../../shared/localModelGroups";

import { inspectLocalModelGroups } from "./inspectLocalModelGroups";

export type LocalModelGroupsInstallInspection = Awaited<
  ReturnType<typeof inspectLocalModelGroups>
> & {
  selectedModelGroupVariantsForInstall: SelectedModelGroupVariants;
  hardwareVariantGroupIdsPickedForInstall: LocalModelGroupId[];
};

export const inspectLocalModelGroupsForInstall = async (
  settings: Parameters<typeof inspectLocalModelGroups>[0] & {
    getScriptTextVariantOverride?: () => Promise<string | null>;
  },
  readVideoMemoryBytes: () => Promise<number | null>
): Promise<LocalModelGroupsInstallInspection> => {
  const savedModelGroupVariants =
    await settings.getSelectedModelGroupVariants();
  const explicitTextVariant = await settings.getScriptTextVariantOverride?.();
  if (explicitTextVariant)
    savedModelGroupVariants["local-llm"] = explicitTextVariant;
  const savedInspection = await inspectLocalModelGroups(
    settings,
    savedModelGroupVariants
  );
  const notInstalledHardwareVariantGroups = savedInspection.groups
    .filter((group) => group.state === "not-installed")
    .map((group) => findLocalModelGroup(group.groupId))
    .filter((group) => group.hardwareVariants !== undefined);
  const groupsToAutoSelect = notInstalledHardwareVariantGroups.filter(
    (group) => group.id !== "local-llm" || !explicitTextVariant
  );
  if (groupsToAutoSelect.length === 0)
    return {
      ...savedInspection,
      selectedModelGroupVariantsForInstall: savedModelGroupVariants,
      hardwareVariantGroupIdsPickedForInstall: []
    };
  const videoMemoryBytes = await readVideoMemoryBytes();
  const selectedModelGroupVariantsForInstall: SelectedModelGroupVariants = {
    ...savedModelGroupVariants
  };
  for (const group of groupsToAutoSelect)
    selectedModelGroupVariantsForInstall[group.id] =
      pickHardwareVariantForVideoMemory(
        group.hardwareVariants ?? [],
        videoMemoryBytes
      );
  const isSameAsSavedSelection = groupsToAutoSelect.every(
    (group) =>
      selectedModelGroupVariantsForInstall[group.id] ===
      savedModelGroupVariants[group.id]
  );
  const inspection = isSameAsSavedSelection
    ? savedInspection
    : await inspectLocalModelGroups(
        settings,
        selectedModelGroupVariantsForInstall
      );
  return {
    ...inspection,
    selectedModelGroupVariantsForInstall,
    hardwareVariantGroupIdsPickedForInstall: groupsToAutoSelect.map(
      (group) => group.id
    )
  };
};
