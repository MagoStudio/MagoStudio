import { Text } from "@components/Text";
import { useCutShotVersionRenderSettingsLabel } from "@domains/scriptProject/useCutShotVersionRenderSettingsLabel";
import { readCutShotVersionSettings } from "@domains/scriptProject/utils/readCutShotVersionSettings";
import { CutShotVersion } from "@schemas/scriptProject";
import { useTranslation } from "react-i18next";

import { VersionReferenceImages } from "./VersionReferenceImages";
import { VersionSettingRow } from "./VersionSettingRow";
import { VersionSettingsHeader } from "./VersionSettingsHeader";

type Props = {
  version: CutShotVersion;
  versionName: string;
  isBusy: boolean;
  onReuseSettings: (version: CutShotVersion) => void;
};

export const CutShotVersionSettingsPanel: React.FC<Props> = ({
  version,
  versionName,
  isBusy,
  onReuseSettings
}) => {
  const { t } = useTranslation();
  const versionSettings = readCutShotVersionSettings(version);
  const renderSettingsLabel = useCutShotVersionRenderSettingsLabel(version);

  return (
    <div
      className="flex max-w-sm flex-col gap-3"
      data-testid={`cut-version-settings-${version.asset_id}`}
    >
      <VersionSettingsHeader
        versionName={versionName}
        onReuseSettings={
          versionSettings ? () => onReuseSettings(version) : undefined
        }
        isReuseSettingsDisabled={isBusy}
        reuseSettingsTestId={`cut-version-reuse-${version.asset_id}`}
      />
      {versionSettings ? (
        <div className="flex max-h-96 flex-col gap-2 overflow-y-auto scrollbar-custom">
          {versionSettings.videoPrompt && (
            <VersionSettingRow
              label={t("script_project.shot_prompt_input.label")}
            >
              {versionSettings.videoPrompt}
            </VersionSettingRow>
          )}
          {versionSettings.dialogue.length > 0 && (
            <VersionSettingRow
              label={t("script_project.shot_dialogue_input.label")}
            >
              {versionSettings.dialogue
                .map((turn) =>
                  turn.speaker ? `${turn.speaker}: ${turn.line}` : turn.line
                )
                .join("\n")}
            </VersionSettingRow>
          )}
          {versionSettings.referenceAssetIds.length > 0 && (
            <VersionSettingRow
              label={t("script_project.scene_references_heading.label")}
            >
              <VersionReferenceImages
                assetIds={versionSettings.referenceAssetIds}
              />
            </VersionSettingRow>
          )}
          {versionSettings.durationSeconds !== undefined && (
            <VersionSettingRow
              label={t("script_project.version_settings_duration.label")}
            >
              {t("script_project.shot_duration_hint.label", {
                seconds: Number(versionSettings.durationSeconds.toFixed(1))
              })}
            </VersionSettingRow>
          )}
          {renderSettingsLabel && (
            <VersionSettingRow
              label={t("script_project.version_settings_render.label")}
            >
              {renderSettingsLabel}
            </VersionSettingRow>
          )}
        </div>
      ) : (
        <Text variant="xs" color="glyph-tertiary">
          {t("script_project.image_inputs_missing.label")}
        </Text>
      )}
    </div>
  );
};
