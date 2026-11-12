import { readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const STYLES_DIR = dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = join(STYLES_DIR, "..", "..");
const THEME_CSS_PATH = join(STYLES_DIR, "tailwind-theme.css");
const UTILS_TS_PATH = join(STYLES_DIR, "..", "common", "utils.ts");

const Z_INDEX_ESCALATION_FLOOR = 100;

const EXPECTED_APP_LEVEL_Z_INDEX_TOKEN_NAMES = [
  "tooltip",
  "popover",
  "toast",
  "nested-modal",
  "modal",
  "page-popover",
  "help-button",
  "menu"
];

if (basename(SRC_ROOT) !== "src") {
  throw new Error(
    `SRC_ROOT resolved to "${SRC_ROOT}", which does not end with "/src". ` +
      "This test's directory-climbing assumption no longer matches this file's location " +
      "on disk — fix SRC_ROOT before trusting this test's result."
  );
}

const isSourceFile = (fileName: string) =>
  /\.(ts|tsx|mts|cts|css)$/.test(fileName);

const isTestFile = (fileName: string) =>
  /\.test\.(ts|tsx|mts|cts)$/.test(fileName);

const collectSourceFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(fullPath);
    if (!isSourceFile(entry.name) || isTestFile(entry.name)) return [];
    return [fullPath];
  });

const extractZIndexTokenNames = (cssContent: string): string[] =>
  Array.from(cssContent.matchAll(/--z-index-([a-z0-9-]+):/g)).map(
    (match) => match[1]
  );

const extractZIndexTokenEntries = (
  cssContent: string
): Array<{ name: string; value: number }> =>
  Array.from(cssContent.matchAll(/--z-index-([a-z0-9-]+):\s*(-?\d+)/g)).map(
    (match) => ({ name: match[1], value: Number(match[2]) })
  );

const extractNamedZIndexTokensArray = (
  utilsSourceContent: string
): string[] => {
  const match = utilsSourceContent.match(
    /const namedZIndexTokens\s*=\s*\[([\s\S]*?)\]/
  );
  if (!match) {
    throw new Error(
      "Could not find `const namedZIndexTokens = [...]` in src/app/common/utils.ts"
    );
  }
  return Array.from(match[1].matchAll(/"([a-z0-9-]+)"/g)).map(
    (tokenMatch) => tokenMatch[1]
  );
};

const tokenHasConsumer = (tokenName: string, sourceFiles: string[]) => {
  const utilityClassPattern = new RegExp(
    `(?<![\\w-])-?z-${tokenName}(?![\\w-])`
  );
  return sourceFiles.some(
    (filePath) =>
      filePath !== THEME_CSS_PATH &&
      utilityClassPattern.test(readFileSync(filePath, "utf8"))
  );
};

describe("every z-index token declared in tailwind-theme.css has a consumer", () => {
  it("names every orphaned --z-index-* token", () => {
    const cssContent = readFileSync(THEME_CSS_PATH, "utf8");
    const tokenNames = extractZIndexTokenNames(cssContent);
    const sourceFiles = collectSourceFiles(SRC_ROOT);

    const orphanedTokenNames = tokenNames.filter(
      (tokenName) => !tokenHasConsumer(tokenName, sourceFiles)
    );

    expect(orphanedTokenNames).toEqual([]);
  });

  it("reports a token that survives only in a .test file as orphaned", () => {
    const deliberatelyOrphanedTokenName = "deliberately-orphaned-fixture";
    const sourceFiles = collectSourceFiles(SRC_ROOT);

    expect(sourceFiles).not.toContain(fileURLToPath(import.meta.url));
    expect(tokenHasConsumer(deliberatelyOrphanedTokenName, sourceFiles)).toBe(
      false
    );
  });

  it("declares exactly the eight expected app-level tokens, each at or above the escalation floor", () => {
    const cssContent = readFileSync(THEME_CSS_PATH, "utf8");
    const tokenEntries = extractZIndexTokenEntries(cssContent);

    expect(new Set(tokenEntries.map((entry) => entry.name))).toEqual(
      new Set(EXPECTED_APP_LEVEL_Z_INDEX_TOKEN_NAMES)
    );
    for (const entry of tokenEntries) {
      expect(entry.value).toBeGreaterThanOrEqual(Z_INDEX_ESCALATION_FLOOR);
    }
  });

  it("keeps `namedZIndexTokens` in src/app/common/utils.ts in sync with the CSS scale", () => {
    const cssContent = readFileSync(THEME_CSS_PATH, "utf8");
    const cssTokenNames = extractZIndexTokenNames(cssContent);
    const utilsSourceContent = readFileSync(UTILS_TS_PATH, "utf8");
    const namedZIndexTokens = extractNamedZIndexTokensArray(utilsSourceContent);

    expect(new Set(namedZIndexTokens)).toEqual(new Set(cssTokenNames));
  });
});
