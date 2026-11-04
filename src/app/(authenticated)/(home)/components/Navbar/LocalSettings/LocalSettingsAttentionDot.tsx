import { useTranslation } from "react-i18next";

export const LocalSettingsAttentionDot = () => {
  const { t } = useTranslation();

  return (
    <span
      role="img"
      aria-label={t("localSettings.tabs.needsAttention")}
      className="size-1.5 shrink-0 rounded-full bg-glyph-error"
    />
  );
};
