import {
  SUPPORTED_LANGUAGE_CODES,
  type SupportedLanguage
} from "../supportedLanguages";

export const isSupportedLanguage = (
  value: unknown
): value is SupportedLanguage =>
  SUPPORTED_LANGUAGE_CODES.some((code) => code === value);
