"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { CrashPage } from "./CrashPage";

export default function NotFound() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <CrashPage
      title={t("titles.crash_page.label")}
      buttonLabel={t("actions.send_me_home.label")}
      onAction={() => router.push("/")}
    />
  );
}
