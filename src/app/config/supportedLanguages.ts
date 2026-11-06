export const SUPPORTED_LANGUAGES = [
  { code: "en", nativeName: "English" },
  { code: "sv", nativeName: "Svenska" }
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]["code"];

export const SUPPORTED_LANGUAGE_CODES: SupportedLanguage[] =
  SUPPORTED_LANGUAGES.map(({ code }) => code);

export const FALLBACK_LANGUAGE: SupportedLanguage = "en";

export const LANGUAGE_STORAGE_KEY = "mago_language";
