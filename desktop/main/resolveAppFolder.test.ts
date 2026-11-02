import path from "node:path";

import { describe, expect, it } from "vitest";

import { resolveAppFolder } from "./resolveAppFolder";

const parentDirectory = path.join("models");
const appFolder = path.join(parentDirectory, "MagoStudio");
const legacyAppFolder = path.join(parentDirectory, "MagoLocal");

const withExistingFolders =
  (...existingFolders: string[]) =>
  (folderPath: string) =>
    existingFolders.includes(folderPath);

describe("resolveAppFolder", () => {
  it("uses the MagoStudio folder on a fresh install", () => {
    expect(resolveAppFolder(parentDirectory, withExistingFolders())).toBe(
      appFolder
    );
  });

  it("keeps using a MagoLocal folder from before the rename", () => {
    expect(
      resolveAppFolder(parentDirectory, withExistingFolders(legacyAppFolder))
    ).toBe(legacyAppFolder);
  });

  it("prefers the MagoStudio folder once it exists", () => {
    expect(
      resolveAppFolder(
        parentDirectory,
        withExistingFolders(appFolder, legacyAppFolder)
      )
    ).toBe(appFolder);
  });
});
