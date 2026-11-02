import { AvailableUiComponentKey } from "@models/shared/availableUiComponents";
import { SettingsGroup } from "@models/shared/types";

const UI_COMPONENTS_NOT_EDITABLE_PER_SHOT: ReadonlySet<AvailableUiComponentKey> =
  new Set<AvailableUiComponentKey>([
    "FileUploaderWithStylizeButton",
    "EditFirstFrameInput",
    "FrameAndMaskInput",
    "ModifyFrameInput",
    "AppliedMaskTile",
    "MultiImageUploader",
    "SingleImageUploader",
    "TwoAngleImageUploader",
    "MaskInput",
    "MaskTrackSelector",
    "MaskModeSelector",
    "MaskPromptInput",
    "VisualMaskSelection",
    "hidden",
    "Prompt",
    "PromptWithAdaptI2vButton",
    "PromptWithEnhancePromptButton"
  ]);

export const filterToShotEditableSettingsGroups = (
  groups: SettingsGroup[]
): SettingsGroup[] =>
  groups
    .map((group) => ({
      ...group,
      sections: group.sections
        .map((section) => ({
          ...section,
          settings: section.settings.filter(
            (setting) =>
              !UI_COMPONENTS_NOT_EDITABLE_PER_SHOT.has(
                setting.ui as AvailableUiComponentKey
              )
          )
        }))
        .filter((section) => section.settings.length > 0)
    }))
    .filter((group) => group.sections.length > 0);

export const collectShotEditableSettingKeys = (
  groups: SettingsGroup[]
): Set<string> =>
  new Set(
    groups.flatMap((group) =>
      group.sections.flatMap((section) =>
        section.settings.flatMap((setting) =>
          setting.secondKey
            ? [String(setting.key), String(setting.secondKey)]
            : [String(setting.key)]
        )
      )
    )
  );
