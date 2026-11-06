import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import sv from "./locales/sv.json";
import {
  FALLBACK_LANGUAGE,
  SUPPORTED_LANGUAGE_CODES
} from "./supportedLanguages";
import { readSavedLanguageOrDetectOnce } from "./utils/readSavedLanguageOrDetectOnce";

const isRunningInBrowser = typeof window !== "undefined";

const initialLanguage = isRunningInBrowser
  ? readSavedLanguageOrDetectOnce({
      storage: window.localStorage,
      systemLanguages: navigator.languages
    })
  : FALLBACK_LANGUAGE;

void i18n.use(initReactI18next).init({
  lng: initialLanguage,
  fallbackLng: FALLBACK_LANGUAGE,
  supportedLngs: SUPPORTED_LANGUAGE_CODES,
  interpolation: {
    escapeValue: false
  },
  resources: {
    en: { translation: en },
    sv: { translation: sv }
  }
});

export { i18n };
