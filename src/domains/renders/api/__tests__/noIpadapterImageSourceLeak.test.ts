import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const ALLOWED_FILES = new Set<string>([
  "src/domains/renders/api/shapeRenderDataForBackend.ts",
  "src/domains/renders/api/shapeRenderDataForBackend.test.ts",
  "src/domains/renders/utils/parseRenderDataForFrontend.ts",
  "src/domains/renders/utils/parseRenderDataForFrontend.test.ts",
  "src/domains/renders/api/__tests__/noIpadapterImageSourceLeak.test.ts",
  "src/domains/renders/api/wirePins/magoV5_0_0.wire.test.ts",
  "src/schemas/asset.ts",
  "src/schemas/clip.ts",
  "src/schemas/data.ts",
  "src/store/renderSettingsStore.dom.test.ts",
  "src/domains/bulkRendersRun/utils/buildCreateBulkRendersRunRequest.ts",
  "src/domains/bulkRendersRun/utils/buildCreateBulkRendersRunRequest.test.ts",
  // Desktop cloud mirroring translates local asset IDs at the IPC boundary.
  "src/domains/cloud/mirrorSources.ts",
  "src/domains/cloud/mirrorSources.test.ts"
]);

const collectFilesContaining = (
  directory: string,
  searchText: string
): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory())
      return collectFilesContaining(fullPath, searchText);
    if (!entry.isFile()) return [];
    return readFileSync(fullPath, "utf8").includes(searchText)
      ? [fullPath]
      : [];
  });

describe("ipadapter_image_source leak guard", () => {
  it("only appears in the approved adapter/bridge files", () => {
    const repoRoot = path.resolve(__dirname, "../../../../..");
    const offenders = collectFilesContaining(
      path.join(repoRoot, "src"),
      "ipadapter_image_source"
    )
      .map((filePath) =>
        path.relative(repoRoot, filePath).split(path.sep).join("/")
      )
      .filter((rel) => !ALLOWED_FILES.has(rel));
    expect(
      offenders,
      `Unexpected ipadapter_image_source references:\n${offenders.join("\n")}`
    ).toEqual([]);
  });
});
