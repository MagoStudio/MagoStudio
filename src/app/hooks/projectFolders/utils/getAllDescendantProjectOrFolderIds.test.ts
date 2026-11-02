import dayjs from "dayjs";
import { describe, it, expect } from "vitest";

import { FolderOrProject } from "../interface";

import { getAllDescendantProjectsOrFolders } from "./getAllDescendantProjectOrFolderIds";

describe("getAllDescendantProjectsOrFolders", () => {
  const mockItems: FolderOrProject[] = [
    {
      id: "child1",
      name: "Child 1",
      parentFolderId: "",
      type: "folder",
      createdAt: dayjs().add(1, "minute").unix()
    },
    {
      id: "child2",
      name: "Child 2",
      parentFolderId: "",
      type: "project",
      createdAt: dayjs().add(2, "minute").unix()
    },
    {
      id: "grandchild1",
      name: "Grandchild 1",
      parentFolderId: "child1",
      type: "folder",
      createdAt: dayjs().add(3, "minute").unix()
    },
    {
      id: "greatgrandchild1",
      name: "Great Grandchild 1",
      parentFolderId: "grandchild1",
      type: "project",
      createdAt: dayjs().add(4, "minute").unix()
    }
  ];

  it("should return all descendants", () => {
    const result = getAllDescendantProjectsOrFolders("", mockItems);
    expect(Array.from(result).map((el) => el.id)).toEqual(
      expect.arrayContaining([
        "child1",
        "child2",
        "grandchild1",
        "greatgrandchild1"
      ])
    );
  });

  it("should return empty set for items with no children", () => {
    const result = getAllDescendantProjectsOrFolders(
      "greatgrandchild1",
      mockItems
    );
    expect(result.length).toBe(0);
  });

  it("should return nested children", () => {
    const result = getAllDescendantProjectsOrFolders("child1", mockItems);
    expect(Array.from(result).map((el) => el.id)).toEqual(
      expect.arrayContaining(["grandchild1", "greatgrandchild1"])
    );
  });

  it("should handle non-existent parent ID", () => {
    const result = getAllDescendantProjectsOrFolders("non-existent", mockItems);
    expect(result.length).toBe(0);
  });

  it("should handle empty items array", () => {
    const result = getAllDescendantProjectsOrFolders("root", []);
    expect(result.length).toBe(0);
  });

  it("should not infinite loop on circular references", () => {
    const circularItems: FolderOrProject[] = [
      {
        id: "folderA",
        name: "Folder A",
        parentFolderId: "folderB",
        type: "folder",
        createdAt: dayjs().unix()
      },
      {
        id: "folderB",
        name: "Folder B",
        parentFolderId: "folderA",
        type: "folder",
        createdAt: dayjs().unix()
      }
    ];

    const result = getAllDescendantProjectsOrFolders("folderA", circularItems);
    expect(result.map((el) => el.id)).toEqual(["folderB", "folderA"]);
  });
});
