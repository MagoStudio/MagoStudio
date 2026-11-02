#!/usr/bin/env node
/**
 * Seals the track-payload read seam: production code
 * must read a track's clip through the accessor family in
 * src/domains/track/utils/ instead of raw `clips[0]` deep paths.
 *
 * Fails when a production source file outside the allowlist contains a raw
 * `clips[0]` / `clips?.[0]` access. Comment lines are ignored so accessor doc
 * comments can name the underlying path.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const SRC_ROOT = fileURLToPath(new URL("../src", import.meta.url));

const RAW_CLIP_ACCESS = /clips\??\.?\[0\]/;
const COMMENT_LINE = /^\s*(\/\/|\/?\*)/;

const ALLOWLISTED_FILES = new Set([
  // The sole canonical clips[0] read — every accessor composes on it.
  "domains/track/utils/getTrackClip.ts",
  // Clip-construction utils build the clips array wholesale; indexing the
  // array they just created is not a payload-shape read.
  "domains/track/utils/buildMockTrackDuringGeneration.ts"
]);

const isExempt = (relativePath) =>
  relativePath.includes(".test.") ||
  relativePath.split(sep).includes("__mocks__") ||
  ALLOWLISTED_FILES.has(relativePath.split(sep).join("/"));

const isSourceFile = (fileName) => /\.(ts|tsx|mts|cts)$/.test(fileName);

const collectSourceFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(fullPath);
    return isSourceFile(entry.name) ? [fullPath] : [];
  });

const violations = [];

for (const filePath of collectSourceFiles(SRC_ROOT)) {
  const relativePath = relative(SRC_ROOT, filePath);
  if (isExempt(relativePath)) continue;

  const lines = readFileSync(filePath, "utf8").split("\n");
  lines.forEach((line, index) => {
    if (COMMENT_LINE.test(line)) return;
    if (RAW_CLIP_ACCESS.test(line)) {
      violations.push(`src/${relativePath}:${index + 1}  ${line.trim()}`);
    }
  });
}

if (violations.length > 0) {
  console.error(
    [
      "Raw `clips[0]` access found outside the track accessor seam:",
      "",
      ...violations,
      "",
      "Read the clip through the accessor family in src/domains/track/utils/",
      "instead (getTrackClip, getTrackAsset, getTrackAssetId, getTrackAssetData,",
      "getTrackDuration, getTrackRenderSettings, getTrackSources)."
    ].join("\n")
  );
  process.exit(1);
}
