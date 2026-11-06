import { Dropdown } from "@components/Dropdown";
import { Text } from "@components/Text";
import { SUPPORTED_LANGUAGES } from "@config/supportedLanguages";
import { switchLanguage } from "@config/switchLanguage";
import { isSupportedLanguage } from "@config/utils/isSupportedLanguage";
import { useTranslation } from "react-i18next";

const languageItems = SUPPORTED_LANGUAGES.map(({ code, nativeName }) => ({
  key: code,
  label: nativeName
}));

export const LanguageSetting = () => {
  const { t, i18n } = useTranslation();

  return (
    <div className="flex flex-col gap-2">
      <Text variant="sm" weight="bold">
        {t("localSettings.general.languageLabel")}
      </Text>
      <Dropdown
        aria-label={t("localSettings.general.languageLabel")}
        items={languageItems}
        selectedKey={i18n.resolvedLanguage}
        onSelectionChange={(selectedLanguage) => {
          if (!isSupportedLanguage(selectedLanguage)) return;
          void switchLanguage(selectedLanguage);
        }}
        className="w-44"
        data-testid="language-setting"
      />
    </div>
  );
};
