import { ShotFolderOrShot } from "@domains/project/shotFolders/interface";
import { isDropAllowed } from "@home/components/dashboard/shared/isDropAllowed";
import { describe, expect, it } from "vitest";

import { resolveDropTargetFolderId } from "./useHandleShotDragEnd";

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

describe("isDropAllowed", () => {
  it("rejects an empty move set", () => {
    expect(isDropAllowed([], "F", [folder("F")])).toBe(false);
  });

  it("rejects when target is in the selection", () => {
    const items = [folder("F"), folder("G")];
    expect(isDropAllowed(["F", "G"], "F", items)).toBe(false);
  });

  it("rejects when target is a descendant of a selected folder", () => {
    const items = [folder("F1"), folder("F2", "F1"), shot("s", "F2")];
    expect(isDropAllowed(["F1"], "F2", items)).toBe(false);
  });

  it("rejects when every selected item is already a child of the target", () => {
    const items = [folder("F"), shot("s1", "F"), shot("s2", "F")];
    expect(isDropAllowed(["s1", "s2"], "F", items)).toBe(false);
  });

  it("allows mixed-parent moves into a new folder", () => {
    const items = [
      folder("F1"),
      folder("F2"),
      shot("s1", "F1"),
      shot("s2", "F2")
    ];
    expect(isDropAllowed(["s1", "s2"], "F1", items)).toBe(true);
  });

  it("allows drop on root from any source folder", () => {
    const items = [folder("F"), shot("s", "F")];
    expect(isDropAllowed(["s"], "", items)).toBe(true);
  });
});

describe("resolveDropTargetFolderId", () => {
  it("resolves the root droppable id to the empty-string sentinel", () => {
    const items = [shot("s")];
    expect(resolveDropTargetFolderId("shot-tree-root-droppable", items)).toBe(
      ""
    );
  });

  it("resolves a folder droppable id to the folder id", () => {
    const items = [folder("F")];
    expect(resolveDropTargetFolderId("shot-folder-droppable-F", items)).toBe(
      "F"
    );
  });

  it("resolves a shot droppable id to the shot's parent folder id", () => {
    const items = [folder("F"), shot("s", "F")];
    expect(resolveDropTargetFolderId("shot-droppable-s", items)).toBe("F");
  });

  it("resolves a root-level shot droppable id to the empty-string sentinel", () => {
    const items = [shot("s")];
    expect(resolveDropTargetFolderId("shot-droppable-s", items)).toBe("");
  });

  it("returns null for an unknown shot id", () => {
    const items = [shot("s")];
    expect(resolveDropTargetFolderId("shot-droppable-ghost", items)).toBe(null);
  });

  it("returns null for an unrecognised droppable prefix", () => {
    expect(resolveDropTargetFolderId("nope-droppable-x", [])).toBe(null);
  });
});
