import { i18n } from "@config/i18n";

/**
 * Helper function to get translated text for use in Playwright tests
 * @param key - The i18n key (e.g., "titles.my_projects.label")
 * @param interpolation - Optional interpolation values
 * @returns The translated text
 */
export function t(key: string, interpolation?: Record<string, any>): string {
  return i18n.t(key, interpolation);
}
