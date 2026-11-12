import { MainButton } from "@components/MainButton";
import { Text } from "@components/Text";
import { useTranslation } from "react-i18next";

type Props = {
  versionName: string;
  onReuseSettings?: () => void;
  isReuseSettingsDisabled?: boolean;
  reuseSettingsTestId?: string;
};

export const VersionSettingsHeader: React.FC<Props> = ({
  versionName,
  onReuseSettings,
  isReuseSettingsDisabled,
  reuseSettingsTestId
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between gap-3">
      <Text variant="xs" weight="semibold" color="glyph-secondary">
        {t("script_project.image_inputs_title.label", {
          version: versionName
        })}
      </Text>
      {onReuseSettings && (
        <MainButton
          size="sm"
          colorScheme="secondary"
          isDisabled={isReuseSettingsDisabled}
          onPress={onReuseSettings}
          aria-label={t("script_project.reuse_settings_button.ariaLabel")}
          data-testid={reuseSettingsTestId}
        >
          {t("script_project.reuse_settings_button.label")}
        </MainButton>
      )}
    </div>
  );
};
