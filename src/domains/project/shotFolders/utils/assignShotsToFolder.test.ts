import { describe, expect, it } from "vitest";

import { ShotFolderOrShot } from "../interface";

import { assignShotsToFolder } from "./assignShotsToFolder";

const folder: ShotFolderOrShot = {
  id: "folder-1",
  name: "Sequence 1",
  parentFolderId: "",
  type: "folder",
  createdAt: 1
};

describe("assignShotsToFolder", () => {
  it("appends shots that are not in the tree yet under the target folder", () => {
    const result = assignShotsToFolder({
      items: [folder],
      shots: [{ id: "shot-1", name: "Take 1" }],
      targetFolderId: "folder-1"
    });

    expect(result).toHaveLength(2);
    expect(result[1]).toMatchObject({
      id: "shot-1",
      name: "Take 1",
      parentFolderId: "folder-1",
      type: "shot"
    });
  });

  it("moves shots the folder sync already added at the root", () => {
    const rootShot: ShotFolderOrShot = {
      id: "shot-1",
      name: "Take 1",
      parentFolderId: "",
      type: "shot",
      createdAt: 2
    };

    const result = assignShotsToFolder({
      items: [folder, rootShot],
      shots: [{ id: "shot-1", name: "Take 1" }],
      targetFolderId: "folder-1"
    });

    expect(result).toHaveLength(2);
    expect(result[1]).toMatchObject({
      id: "shot-1",
      parentFolderId: "folder-1"
    });
  });

  it("leaves unrelated items untouched", () => {
    const otherShot: ShotFolderOrShot = {
      id: "shot-9",
      name: "Take 9",
      parentFolderId: "folder-2",
      type: "shot",
      createdAt: 3
    };

    const result = assignShotsToFolder({
      items: [otherShot],
      shots: [{ id: "shot-1", name: "Take 1" }],
      targetFolderId: "folder-1"
    });

    expect(result[0]).toEqual(otherShot);
  });

  it("keeps the root placement when the target folder is the root", () => {
    const result = assignShotsToFolder({
      items: [],
      shots: [{ id: "shot-1", name: "Take 1" }],
      targetFolderId: ""
    });

    expect(result[0]).toMatchObject({ id: "shot-1", parentFolderId: "" });
  });
});
