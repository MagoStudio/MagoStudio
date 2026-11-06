import { describe, expect, it } from "vitest";

import { LANGUAGE_STORAGE_KEY } from "../supportedLanguages";

import { readSavedLanguageOrDetectOnce } from "./readSavedLanguageOrDetectOnce";

const createMemoryStorage = (initialEntries: Record<string, string> = {}) => {
  const entries = new Map(Object.entries(initialEntries));
  return {
    entries,
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => {
      entries.set(key, value);
    }
  };
};

describe("readSavedLanguageOrDetectOnce", () => {
  it("detects the system language on first launch and saves it", () => {
    const storage = createMemoryStorage();

    const language = readSavedLanguageOrDetectOnce({
      storage,
      systemLanguages: ["sv-SE"]
    });

    expect(language).toBe("sv");
    expect(storage.entries.get(LANGUAGE_STORAGE_KEY)).toBe("sv");
  });

  it("keeps the saved language even when the system language changes", () => {
    const storage = createMemoryStorage({ [LANGUAGE_STORAGE_KEY]: "en" });

    const language = readSavedLanguageOrDetectOnce({
      storage,
      systemLanguages: ["sv-SE"]
    });

    expect(language).toBe("en");
  });

  it("detects again when the saved value is not a supported language", () => {
    const storage = createMemoryStorage({ [LANGUAGE_STORAGE_KEY]: "klingon" });

    const language = readSavedLanguageOrDetectOnce({
      storage,
      systemLanguages: ["de-DE"]
    });

    expect(language).toBe("en");
    expect(storage.entries.get(LANGUAGE_STORAGE_KEY)).toBe("en");
  });
});
