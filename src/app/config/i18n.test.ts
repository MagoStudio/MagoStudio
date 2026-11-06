import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { i18n } from "./i18n";
import { SUPPORTED_LANGUAGE_CODES } from "./supportedLanguages";

type Catalog = { [key: string]: string | Catalog };

const flattenCatalog = (
  catalog: Catalog,
  prefix = ""
): Record<string, string> =>
  Object.fromEntries(
    Object.entries(catalog).flatMap(([key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      return typeof value === "string"
        ? [[fullKey, value]]
        : Object.entries(flattenCatalog(value, fullKey));
    })
  );

const interpolationPlaceholder = /{{[^}]+}}/g;
const nestedTranslation = /\$t\([^)]*\)/g;
const markupTag = /<\/?[A-Za-z0-9]+\s*\/?>/g;

const placeholdersIn = (text: string) =>
  [
    ...(text.match(interpolationPlaceholder) ?? []),
    ...(text.match(nestedTranslation) ?? []),
    ...(text.match(markupTag) ?? [])
  ]
    .map((placeholder) => placeholder.replace(/\s/g, ""))
    .sort();

const pluralSuffix = /_(?:zero|one|two|few|many|other)$/;

const expectedTranslationKeys = (
  englishKeys: string[],
  language: string
): Map<string, string> => {
  const pluralCategories = new Intl.PluralRules(language).resolvedOptions()
    .pluralCategories;
  const englishKeyByTranslationKey = new Map<string, string>();
  for (const englishKey of englishKeys) {
    if (!pluralSuffix.test(englishKey)) {
      englishKeyByTranslationKey.set(englishKey, englishKey);
      continue;
    }
    const pluralBaseKey = englishKey.replace(pluralSuffix, "");
    const englishOtherKey = englishKeys.includes(`${pluralBaseKey}_other`)
      ? `${pluralBaseKey}_other`
      : englishKey;
    for (const category of pluralCategories)
      englishKeyByTranslationKey.set(
        `${pluralBaseKey}_${category}`,
        englishOtherKey
      );
  }
  return englishKeyByTranslationKey;
};

const sourceRoot = path.resolve(process.cwd(), "src");
const sourceExtension = /\.(?:ts|tsx)$/;
const ignoredFile = /(?:\.test|\.stories)\.(?:ts|tsx)$/;
const translationKeyLiteral = /["'`]([A-Za-z][\w-]*(?:\.[\w-]+)+)["'`]/g;

const sourceFiles = (directory: string): string[] =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(entryPath);
    if (!sourceExtension.test(entry.name) || ignoredFile.test(entry.name))
      return [];
    return [entryPath];
  });

describe("i18n resources", () => {
  it("defines every static translation key used by production source", () => {
    const resources = i18n.getResourceBundle("en", "translation") as Record<
      string,
      unknown
    >;
    const namespaces = new Set(Object.keys(resources));
    const missing = new Map<string, string[]>();

    for (const file of sourceFiles(sourceRoot)) {
      if (path.resolve(file) === path.resolve(__filename)) continue;
      const relativeFile = path.relative(process.cwd(), file);
      const source = fs.readFileSync(file, "utf8");

      for (const match of source.matchAll(translationKeyLiteral)) {
        const key = match[1];
        if (!key || !namespaces.has(key.split(".")[0] ?? "")) continue;
        const hasPluralForms =
          i18n.exists(`${key}_one`) && i18n.exists(`${key}_other`);
        if (i18n.exists(key) || hasPluralForms) continue;
        const locations = missing.get(key) ?? [];
        locations.push(relativeFile);
        missing.set(key, locations);
      }
    }

    const report = [...missing]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, files]) => `${key} (${[...new Set(files)].join(", ")})`);
    expect(report, `Missing i18n keys:\n${report.join("\n")}`).toEqual([]);
  });

  it.each(SUPPORTED_LANGUAGE_CODES.filter((code) => code !== "en"))(
    "%s has the keys its plural rules need, with the placeholders of English",
    (language) => {
      const englishStrings = flattenCatalog(
        i18n.getResourceBundle("en", "translation") as Catalog
      );
      const translatedStrings = flattenCatalog(
        i18n.getResourceBundle(language, "translation") as Catalog
      );
      const englishKeyByTranslationKey = expectedTranslationKeys(
        Object.keys(englishStrings),
        language
      );

      expect(Object.keys(translatedStrings).sort()).toEqual(
        [...englishKeyByTranslationKey.keys()].sort()
      );
      for (const [translationKey, englishKey] of englishKeyByTranslationKey) {
        expect(
          placeholdersIn(translatedStrings[translationKey] ?? ""),
          `placeholders of ${translationKey}`
        ).toEqual(placeholdersIn(englishStrings[englishKey] ?? ""));
      }
    }
  );

  it("defines the dynamically selected Script Project version-review labels", () => {
    for (const field of ["good", "bad", "todo"]) {
      expect(i18n.exists(`script_project.version_review_${field}.label`)).toBe(
        true
      );
      expect(
        i18n.exists(`script_project.version_review_${field}.placeholder`)
      ).toBe(true);
    }
  });
});
