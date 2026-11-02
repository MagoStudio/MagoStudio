import { FolderOrProject } from "@hooks/projectFolders/interface";
import { describe, expect, it } from "vitest";

import {
  buildBulkMoveResult,
  resolveProjectDropTargetFolderId
} from "./useHandleProjectMenuDragEnd";

const folder = (
  id: string,
  parentFolderId: string | null = ""
): FolderOrProject => ({
  id,
  name: id,
  parentFolderId,
  type: "folder",
  createdAt: 0
});

const project = (
  id: string,
  parentFolderId: string | null = ""
): FolderOrProject => ({
  id,
  name: id,
  parentFolderId,
  type: "project",
  createdAt: 0
});

describe("resolveProjectDropTargetFolderId", () => {
  it("resolves the root droppable id to the root sentinel", () => {
    expect(
      resolveProjectDropTargetFolderId("project-panel-root-droppable", [])
    ).toBe("");
  });

  it("resolves a folder droppable id to the folder id", () => {
    expect(
      resolveProjectDropTargetFolderId("folder-droppable-2", [folder("2")])
    ).toBe("2");
  });

  it("resolves a project droppable id to the project's parent folder id", () => {
    const items = [folder("1"), project("p1", "1")];
    expect(
      resolveProjectDropTargetFolderId("project-droppable-p1", items)
    ).toBe("1");
  });

  it("resolves a root-level project droppable id to the root sentinel", () => {
    const items = [project("p1")];
    expect(
      resolveProjectDropTargetFolderId("project-droppable-p1", items)
    ).toBe("");
  });

  it("returns null for an unknown project id", () => {
    expect(
      resolveProjectDropTargetFolderId("project-droppable-ghost", [])
    ).toBe(null);
  });

  it("returns null for an unrecognised prefix", () => {
    expect(resolveProjectDropTargetFolderId("nope-x", [])).toBe(null);
  });
});

describe("buildBulkMoveResult", () => {
  it("moves a single dragged folder under the target folder", () => {
    const items = [folder("1"), folder("2"), folder("3", "1")];
    const result = buildBulkMoveResult(
      ["folder-draggable-1"],
      "folder-droppable-2",
      items
    );
    expect(result?.movedIds).toEqual(["1"]);
    const moved = result?.updated.find((i) => i.id === "1");
    expect(moved?.parentFolderId).toBe("2");
  });

  it("moves a folder AND a sibling project together in a single update", () => {
    const items = [folder("1"), folder("2"), project("p43")];
    const result = buildBulkMoveResult(
      ["folder-draggable-1", "project-draggable-p43"],
      "folder-droppable-2",
      items
    );
    expect(result?.movedIds.sort()).toEqual(["1", "p43"]);
    expect(result?.updated.find((i) => i.id === "1")?.parentFolderId).toBe("2");
    expect(result?.updated.find((i) => i.id === "p43")?.parentFolderId).toBe(
      "2"
    );
  });

  it("prunes a project nested under a selected folder before moving", () => {
    const items = [folder("1"), folder("2"), project("p1-inside", "1")];
    const result = buildBulkMoveResult(
      ["folder-draggable-1", "project-draggable-p1-inside"],
      "folder-droppable-2",
      items
    );
    expect(result?.movedIds).toEqual(["1"]);
    expect(result?.updated.find((i) => i.id === "1")?.parentFolderId).toBe("2");
    expect(
      result?.updated.find((i) => i.id === "p1-inside")?.parentFolderId
    ).toBe("1");
  });

  it("moves multiple selected projects to root via the root droppable", () => {
    const items = [folder("1"), project("p1", "1"), project("p2", "1")];
    const result = buildBulkMoveResult(
      ["project-draggable-p1", "project-draggable-p2"],
      "project-panel-root-droppable",
      items
    );
    expect(result?.movedIds.sort()).toEqual(["p1", "p2"]);
    expect(result?.updated.find((i) => i.id === "p1")?.parentFolderId).toBe("");
    expect(result?.updated.find((i) => i.id === "p2")?.parentFolderId).toBe("");
  });

  it("returns null when dropping onto a selected folder itself", () => {
    const items = [folder("1"), folder("2")];
    const result = buildBulkMoveResult(
      ["folder-draggable-1", "folder-draggable-2"],
      "folder-droppable-1",
      items
    );
    expect(result).toBe(null);
  });

  it("returns null when dropping a folder into one of its descendants", () => {
    const items = [folder("1"), folder("2", "1"), folder("3", "2")];
    const result = buildBulkMoveResult(
      ["folder-draggable-1"],
      "folder-droppable-3",
      items
    );
    expect(result).toBe(null);
  });

  it("returns null when every selected item is already a child of the target", () => {
    const items = [folder("1"), project("p1", "1"), project("p2", "1")];
    const result = buildBulkMoveResult(
      ["project-draggable-p1", "project-draggable-p2"],
      "folder-droppable-1",
      items
    );
    expect(result).toBe(null);
  });

  it("returns null when the dragged ids are empty", () => {
    expect(buildBulkMoveResult([], "folder-droppable-1", [folder("1")])).toBe(
      null
    );
  });

  it("returns null when the droppedOnId is empty", () => {
    expect(buildBulkMoveResult(["folder-draggable-1"], "", [folder("1")])).toBe(
      null
    );
  });
});
