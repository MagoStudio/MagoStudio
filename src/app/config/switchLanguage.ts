import { i18n } from "./i18n";
import {
  LANGUAGE_STORAGE_KEY,
  type SupportedLanguage
} from "./supportedLanguages";

export const switchLanguage = async (language: SupportedLanguage) => {
  await i18n.changeLanguage(language);
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
};
