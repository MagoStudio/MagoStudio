"use client";

import { useTranslation } from "react-i18next";

import { CrashPage } from "./CrashPage";

export default function Error({
  error: _error,
  reset: _reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();

  return (
    <CrashPage
      title={t("titles.crash_page.label")}
      buttonLabel={t("actions.send_me_home.label")}
      onAction={() => window.location.assign("/")}
    />
  );
}
