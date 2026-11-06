import { FALLBACK_LANGUAGE } from "@config/supportedLanguages";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export const DocumentLanguageSync = () => {
  const { i18n } = useTranslation();
  const activeLanguage = i18n.resolvedLanguage ?? FALLBACK_LANGUAGE;

  // oxlint-disable-next-line custom-react/no-use-effect -- syncs the active UI language to <html lang>, which React does not own after hydration; running after hydration keeps the static lang="en" from mismatching.
  useEffect(() => {
    document.documentElement.lang = activeLanguage;
  }, [activeLanguage]);

  return null;
};
