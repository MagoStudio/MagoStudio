import { useTranslation } from "react-i18next";

import { VersionSettingRow } from "./VersionSettingRow";
import { VersionSettingsHeader } from "./VersionSettingsHeader";

type Props = {
  panelCount: number;
  versionName: string;
};

export const StoryboardVersionInputsPanel: React.FC<Props> = ({
  panelCount,
  versionName
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3">
      <VersionSettingsHeader versionName={versionName} />
      <VersionSettingRow
        label={t("script_project.version_settings_panels.label")}
      >
        {t("script_project.version_settings_panels.value", {
          count: panelCount
        })}
      </VersionSettingRow>
    </div>
  );
};
