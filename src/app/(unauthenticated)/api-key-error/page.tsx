"use client";

import { MainButton } from "@components/MainButton";
import { Text } from "@components/Text";
import { useTranslation } from "react-i18next";

export default function ApiKeyErrorPage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <img alt="Cat animation" className="w-64 h-64 mb-6" src="/cat.gif" />
      <Text variant="lg" color="glyph-primary" weight="medium" className="mb-2">
        {t("notifications.api_key_error.title.label")}
      </Text>
      <Text
        variant="md"
        color="glyph-secondary"
        className="mb-8 text-center max-w-md"
      >
        {t("notifications.api_key_error.description")}
      </Text>
      <MainButton href="/">{t("actions.try_again.label")}</MainButton>
    </div>
  );
}
