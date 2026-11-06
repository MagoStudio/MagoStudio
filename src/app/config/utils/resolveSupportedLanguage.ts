import {
  FALLBACK_LANGUAGE,
  type SupportedLanguage
} from "../supportedLanguages";

const supportedLanguageForSystemLanguage = (
  systemLanguage: string
): SupportedLanguage | null => {
  const primarySubtag = systemLanguage.toLowerCase().split(/[-_]/)[0];
  if (primarySubtag === "sv") return "sv";
  if (primarySubtag === "en") return "en";
  return null;
};

export const resolveSupportedLanguage = (
  systemLanguages: readonly string[]
): SupportedLanguage => {
  for (const systemLanguage of systemLanguages) {
    const supportedLanguage =
      supportedLanguageForSystemLanguage(systemLanguage);
    if (supportedLanguage) return supportedLanguage;
  }
  return FALLBACK_LANGUAGE;
};
