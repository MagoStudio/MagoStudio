import type { ShotFolderOrShot } from "@domains/project/shotFolders/interface";
import { describe, expect, it } from "vitest";

import { buildShotFolderTree } from "./buildShotFolderTree";

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

describe("buildShotFolderTree", () => {
  it("puts root Shots before root Folders", () => {
    const tree = buildShotFolderTree([
      folder("folder-a"),
      shot("shot-a"),
      shot("shot-b")
    ]);

    expect(tree.map((node) => node.id)).toEqual([
      "shot-a",
      "shot-b",
      "folder-a"
    ]);
  });

  it("nests Folders and Shots to three levels", () => {
    const tree = buildShotFolderTree([
      folder("level-1"),
      folder("level-2", "level-1"),
      folder("level-3", "level-2"),
      shot("shot-in-3", "level-3")
    ]);

    const level1 = tree.find((node) => node.id === "level-1");
    const level2 = level1?.children.find((node) => node.id === "level-2");
    const level3 = level2?.children.find((node) => node.id === "level-3");

    expect(level3?.children.map((node) => node.id)).toEqual(["shot-in-3"]);
  });

  it("keeps a Folder with no Shots as a childless node", () => {
    const tree = buildShotFolderTree([folder("empty-folder")]);

    expect(tree).toEqual([
      {
        id: "empty-folder",
        name: "empty-folder",
        parentFolderId: "",
        type: "folder",
        createdAt: 0,
        children: []
      }
    ]);
  });

  it("falls back to the root level for an orphaned parentFolderId", () => {
    const tree = buildShotFolderTree([shot("orphan-shot", "missing-folder")]);

    expect(tree.map((node) => node.id)).toEqual(["orphan-shot"]);
  });

  it("keeps a stable order among siblings of the same type", () => {
    const tree = buildShotFolderTree([
      shot("shot-c"),
      shot("shot-a"),
      shot("shot-b")
    ]);

    expect(tree.map((node) => node.id)).toEqual(["shot-c", "shot-a", "shot-b"]);
  });

  it("roots a self-parented Folder instead of dropping it", () => {
    const tree = buildShotFolderTree([
      folder("self-parented", "self-parented")
    ]);

    expect(tree.map((node) => node.id)).toEqual(["self-parented"]);
  });

  it("roots both members of a parent cycle instead of dropping them", () => {
    const tree = buildShotFolderTree([
      folder("folder-a", "folder-b"),
      folder("folder-b", "folder-a")
    ]);

    expect(tree.map((node) => node.id).sort()).toEqual([
      "folder-a",
      "folder-b"
    ]);
  });

  it("roots a Shot whose parentFolderId points at another Shot", () => {
    const tree = buildShotFolderTree([
      shot("parent-shot"),
      shot("child-shot", "parent-shot")
    ]);

    expect(tree.map((node) => node.id).sort()).toEqual([
      "child-shot",
      "parent-shot"
    ]);
    const parentNode = tree.find((node) => node.id === "parent-shot");
    expect(parentNode?.children).toEqual([]);
  });

  it("keeps one node per id when the input has duplicate ids", () => {
    const tree = buildShotFolderTree([shot("dup"), shot("dup")]);

    expect(tree).toHaveLength(1);
  });

  it("does not duplicate a node under its parent when the input repeats it", () => {
    const tree = buildShotFolderTree([
      folder("parent"),
      shot("child", "parent"),
      shot("child", "parent")
    ]);

    const parentNode = tree.find((node) => node.id === "parent");
    expect(parentNode?.children).toHaveLength(1);
  });

  it("caps nesting depth and roots a Folder that would exceed it", () => {
    const MAX_DEPTH = 32;
    const items = Array.from({ length: MAX_DEPTH + 10 }, (_, index) =>
      folder(`folder-${index}`, index === 0 ? "" : `folder-${index - 1}`)
    );

    const tree = buildShotFolderTree(items);

    let depth = 0;
    let node = tree.find((candidate) => candidate.id === "folder-0");
    while (node && node.children.length > 0) {
      depth += 1;
      node = node.children[0];
    }

    expect(depth).toBeLessThan(MAX_DEPTH);

    const allIds = new Set(items.map((item) => item.id));
    const seenIds = new Set<string>();
    const collectIds = (nodes: typeof tree) => {
      for (const candidate of nodes) {
        seenIds.add(candidate.id);
        collectIds(candidate.children);
      }
    };
    collectIds(tree);
    expect(seenIds).toEqual(allIds);
  });
});
