import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const SRC_ROOT = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  ".."
);

const BANNED_IDENTIFIERS = [
  "PromptWithTags",
  "ControlledTextarea",
  "hasPromptWithTagsUi"
];

const isSourceFile = (fileName: string) => /\.(ts|tsx|mts|cts)$/.test(fileName);

const collectSourceFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(fullPath);
    return isSourceFile(entry.name) ? [fullPath] : [];
  });

describe("PromptWithTags/ControlledTextarea/hasPromptWithTagsUi stay deleted from availableUiComponents and the rest of src/", () => {
  it.each(BANNED_IDENTIFIERS)(
    "no file under src/ contains the identifier %s",
    (identifier) => {
      const offendingFiles = collectSourceFiles(SRC_ROOT)
        .filter((filePath) => filePath !== fileURLToPath(import.meta.url))
        .filter((filePath) =>
          readFileSync(filePath, "utf8").includes(identifier)
        );

      expect(offendingFiles).toEqual([]);
    }
  );
});
