import {
  LANGUAGE_STORAGE_KEY,
  type SupportedLanguage
} from "../supportedLanguages";

import { isSupportedLanguage } from "./isSupportedLanguage";
import { resolveSupportedLanguage } from "./resolveSupportedLanguage";

type Params = {
  storage: Pick<Storage, "getItem" | "setItem">;
  systemLanguages: readonly string[];
};

export const readSavedLanguageOrDetectOnce = ({
  storage,
  systemLanguages
}: Params): SupportedLanguage => {
  const savedLanguage = storage.getItem(LANGUAGE_STORAGE_KEY);
  if (isSupportedLanguage(savedLanguage)) return savedLanguage;

  const detectedLanguage = resolveSupportedLanguage(systemLanguages);
  storage.setItem(LANGUAGE_STORAGE_KEY, detectedLanguage);
  return detectedLanguage;
};
