import type { ShotFolderOrShot } from "@domains/project/shotFolders/interface";
import { describe, expect, it } from "vitest";

import { buildShotBreadcrumb } from "./buildShotBreadcrumb";

const makeFolder = (
  id: string,
  name: string,
  parentFolderId = ""
): ShotFolderOrShot => ({
  id,
  name,
  parentFolderId,
  type: "folder",
  createdAt: 0
});

const makeShot = (
  id: string,
  name: string,
  parentFolderId = ""
): ShotFolderOrShot => ({
  id,
  name,
  parentFolderId,
  type: "shot",
  createdAt: 0
});

describe("buildShotBreadcrumb", () => {
  it("returns empty string when shotId is undefined", () => {
    expect(buildShotBreadcrumb([], undefined)).toBe("");
  });

  it("returns empty string when shotFolders is empty", () => {
    expect(buildShotBreadcrumb([], "shot-1")).toBe("");
  });

  it("returns shot name for root-level shot", () => {
    const items = [makeShot("shot-1", "My Shot")];
    expect(buildShotBreadcrumb(items, "shot-1")).toBe("My Shot");
  });

  it("returns folder / shot path for nested shot", () => {
    const items = [
      makeFolder("folder-1", "Folder A"),
      makeShot("shot-1", "Shot 1", "folder-1")
    ];
    expect(buildShotBreadcrumb(items, "shot-1")).toBe("Folder A / Shot 1");
  });

  it("returns deeply nested path", () => {
    const items = [
      makeFolder("folder-1", "Root"),
      makeFolder("folder-2", "Sub", "folder-1"),
      makeShot("shot-1", "Deep Shot", "folder-2")
    ];
    expect(buildShotBreadcrumb(items, "shot-1")).toBe("Root / Sub / Deep Shot");
  });

  it("returns empty string when shot not found", () => {
    const items = [makeShot("shot-1", "Shot 1")];
    expect(buildShotBreadcrumb(items, "nonexistent")).toBe("");
  });

  it("handles circular parent references without infinite loop", () => {
    const items: ShotFolderOrShot[] = [
      {
        id: "f1",
        name: "Folder A",
        parentFolderId: "f2",
        type: "folder",
        createdAt: 0
      },
      {
        id: "f2",
        name: "Folder B",
        parentFolderId: "f1",
        type: "folder",
        createdAt: 0
      },
      {
        id: "s1",
        name: "Shot",
        parentFolderId: "f1",
        type: "shot",
        createdAt: 0
      }
    ];
    const result = buildShotBreadcrumb(items, "s1");
    expect(result).toContain("Shot");
    expect(result).toContain("Folder A");
  });
});
