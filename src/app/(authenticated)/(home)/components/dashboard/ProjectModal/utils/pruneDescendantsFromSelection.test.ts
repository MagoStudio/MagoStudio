import { ShotFolderOrShot } from "@domains/project/shotFolders/interface";
import { describe, it, expect } from "vitest";

import { pruneDescendantsFromSelection } from "./pruneDescendantsFromSelection";

const folder = (id: string, parentFolderId = ""): ShotFolderOrShot => ({
  id,
  name: id,
  parentFolderId,
  type: "folder",
  createdAt: 0
});

const shot = (id: string, parentFolderId = ""): ShotFolderOrShot => ({
  id,
  name: id,
  parentFolderId,
  type: "shot",
  createdAt: 0
});

describe("pruneDescendantsFromSelection", () => {
  it("returns the same set when no parent/child relationship is in the selection", () => {
    const items = [shot("a"), shot("b"), shot("c")];
    const result = pruneDescendantsFromSelection(["a", "b"], items);
    expect(result.sort()).toEqual(["a", "b"]);
  });

  it("drops a shot whose parent folder is also selected", () => {
    const items = [folder("F"), shot("s1", "F"), shot("s2", "F")];
    const result = pruneDescendantsFromSelection(["F", "s1"], items);
    expect(result).toEqual(["F"]);
  });

  it("drops nested folder when an ancestor folder is selected", () => {
    const items = [
      folder("F1"),
      folder("F2", "F1"),
      shot("s1", "F2"),
      shot("s2", "F1")
    ];
    const result = pruneDescendantsFromSelection(["F1", "F2", "s1"], items);
    expect(result).toEqual(["F1"]);
  });

  it("keeps siblings that are children of an unselected folder", () => {
    const items = [
      folder("F"),
      shot("s1", "F"),
      shot("s2", "F"),
      shot("s3", "")
    ];
    const result = pruneDescendantsFromSelection(["s1", "s2", "s3"], items);
    expect(result.sort()).toEqual(["s1", "s2", "s3"]);
  });

  it("returns a singleton selection unchanged", () => {
    const items = [folder("F"), shot("s1", "F")];
    expect(pruneDescendantsFromSelection(["F"], items)).toEqual(["F"]);
    expect(pruneDescendantsFromSelection(["s1"], items)).toEqual(["s1"]);
  });

  it("drops a single stale id that does not exist in allItems", () => {
    const items = [shot("a")];
    expect(pruneDescendantsFromSelection(["ghost"], items)).toEqual([]);
  });

  it("drops items missing from allItems", () => {
    const items = [shot("a"), shot("b")];
    const result = pruneDescendantsFromSelection(["a", "ghost"], items);
    expect(result).toEqual(["a"]);
  });

  it("drops a deeply nested shot when only its grandparent folder is selected", () => {
    const items = [
      folder("F1"),
      folder("F2", "F1"),
      folder("F3", "F2"),
      shot("s", "F3")
    ];
    const result = pruneDescendantsFromSelection(["F1", "s"], items);
    expect(result).toEqual(["F1"]);
  });

  it("does not infinite-loop on a self-parent cycle", () => {
    const items: ShotFolderOrShot[] = [
      { id: "F", name: "F", parentFolderId: "F", type: "folder", createdAt: 0 }
    ];
    expect(pruneDescendantsFromSelection(["F"], items)).toEqual(["F"]);
  });
});
