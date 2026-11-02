import dayjs from "dayjs";
import { describe, it, expect } from "vitest";

import { FolderOrProject } from "../interface";

import { getCircularFolderIds } from "./getCircularFolderIds";

const makeFolder = (id: string, parentFolderId: string): FolderOrProject => ({
  id,
  name: id,
  parentFolderId,
  type: "folder",
  createdAt: dayjs().unix()
});

const makeProject = (id: string, parentFolderId: string): FolderOrProject => ({
  id,
  name: id,
  parentFolderId,
  type: "project",
  createdAt: dayjs().unix()
});

describe("getCircularFolderIds", () => {
  it("should return empty array when there are no circular references", () => {
    const items: FolderOrProject[] = [
      makeFolder("a", ""),
      makeFolder("b", "a"),
      makeProject("p1", "b")
    ];
    expect(getCircularFolderIds(items)).toEqual([]);
  });

  it("should detect a simple two-folder cycle (A → B → A)", () => {
    const items: FolderOrProject[] = [
      makeFolder("a", "b"),
      makeFolder("b", "a")
    ];
    const result = getCircularFolderIds(items);
    expect(result).toHaveLength(2);
    expect(result).toEqual(expect.arrayContaining(["a", "b"]));
  });

  it("should detect a self-referencing folder (A → A)", () => {
    const items: FolderOrProject[] = [makeFolder("a", "a")];
    const result = getCircularFolderIds(items);
    expect(result).toEqual(["a"]);
  });

  it("should detect a longer cycle (A → B → C → A)", () => {
    const items: FolderOrProject[] = [
      makeFolder("a", "b"),
      makeFolder("b", "c"),
      makeFolder("c", "a")
    ];
    const result = getCircularFolderIds(items);
    expect(result).toHaveLength(3);
    expect(result).toEqual(expect.arrayContaining(["a", "b", "c"]));
  });

  it("should only return circular folder IDs, not non-circular ones", () => {
    const items: FolderOrProject[] = [
      makeFolder("root", ""),
      makeFolder("child", "root"),
      makeFolder("a", "b"),
      makeFolder("b", "a")
    ];
    const result = getCircularFolderIds(items);
    expect(result).toHaveLength(2);
    expect(result).toEqual(expect.arrayContaining(["a", "b"]));
    expect(result).not.toContain("root");
    expect(result).not.toContain("child");
  });

  it("should not flag orphaned folders whose parent doesn't exist", () => {
    const items: FolderOrProject[] = [makeFolder("orphan", "nonexistent")];
    expect(getCircularFolderIds(items)).toEqual([]);
  });

  it("should ignore projects (only folders can be parents)", () => {
    const items: FolderOrProject[] = [
      makeProject("p1", "p2"),
      makeProject("p2", "p1")
    ];
    expect(getCircularFolderIds(items)).toEqual([]);
  });

  it("should handle empty array", () => {
    expect(getCircularFolderIds([])).toEqual([]);
  });

  it("should not flag folders that point into a cycle but are not part of it", () => {
    const items: FolderOrProject[] = [
      makeFolder("d", "a"),
      makeFolder("a", "b"),
      makeFolder("b", "a")
    ];
    const result = getCircularFolderIds(items);
    expect(result).toHaveLength(2);
    expect(result).toEqual(expect.arrayContaining(["a", "b"]));
    expect(result).not.toContain("d");
  });
});
