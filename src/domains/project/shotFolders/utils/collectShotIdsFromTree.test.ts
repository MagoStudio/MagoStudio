import type { ShotFolderOrShot } from "@domains/project/shotFolders/interface";
import { describe, expect, it } from "vitest";

import { buildShotFolderTree } from "./buildShotFolderTree";
import { collectShotIdsFromTree } from "./collectShotIdsFromTree";

const shot = (id: string, parentFolderId = ""): ShotFolderOrShot => ({
  id,
  name: id,
  parentFolderId,
  type: "shot",
  createdAt: 0
});

const folder = (id: string, parentFolderId = ""): ShotFolderOrShot => ({
  id,
  name: id,
  parentFolderId,
  type: "folder",
  createdAt: 0
});

describe("collectShotIdsFromTree", () => {
  it("returns an empty array for an empty tree", () => {
    expect(collectShotIdsFromTree([])).toEqual([]);
  });

  it("collects root Shot ids", () => {
    const tree = buildShotFolderTree([shot("shot-a"), shot("shot-b")]);
    expect(new Set(collectShotIdsFromTree(tree))).toEqual(
      new Set(["shot-a", "shot-b"])
    );
  });

  it("collects Shot ids nested inside Folders", () => {
    const tree = buildShotFolderTree([
      shot("root-shot"),
      folder("folder-a"),
      shot("nested-shot", "folder-a"),
      folder("nested-folder", "folder-a"),
      shot("deep-shot", "nested-folder")
    ]);

    expect(new Set(collectShotIdsFromTree(tree))).toEqual(
      new Set(["root-shot", "nested-shot", "deep-shot"])
    );
  });

  it("skips a Folder with no Shots", () => {
    const tree = buildShotFolderTree([folder("empty-folder")]);
    expect(collectShotIdsFromTree(tree)).toEqual([]);
  });

  it("returns a Shot id once even if it appears twice in the tree", () => {
    const tree = buildShotFolderTree([
      folder("parent"),
      shot("dup", "parent"),
      shot("dup", "parent")
    ]);

    expect(collectShotIdsFromTree(tree)).toEqual(["dup"]);
  });

  it("collects every Shot id from a deeply nested chain without overflowing", () => {
    const depth = 500;
    const items: ShotFolderOrShot[] = Array.from(
      { length: depth },
      (_, index) =>
        folder(`folder-${index}`, index === 0 ? "" : `folder-${index - 1}`)
    );
    items.push(shot("deep-shot", `folder-${depth - 1}`));

    const tree = buildShotFolderTree(items);

    expect(() => collectShotIdsFromTree(tree)).not.toThrow();
    expect(collectShotIdsFromTree(tree)).toContain("deep-shot");
  });
});
