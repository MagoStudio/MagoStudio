import { describe, expect, it } from "vitest";

import { collectShotIdsToDelete } from "./collectShotIdsToDelete";

const shot = (id: string, parentFolderId = "") => ({
  id,
  name: id,
  parentFolderId,
  type: "shot" as const,
  createdAt: 0
});
const folder = (id: string, parentFolderId = "") => ({
  id,
  name: id,
  parentFolderId,
  type: "folder" as const,
  createdAt: 0
});

describe("collectShotIdsToDelete", () => {
  it("returns shot ids as-is", () => {
    const items = [shot("s1"), shot("s2"), shot("s3")];
    expect(collectShotIdsToDelete(["s1", "s2"], items)).toEqual(
      new Set(["s1", "s2"])
    );
  });

  it("expands a folder to its descendant shots", () => {
    const items = [
      folder("f1"),
      shot("s1", "f1"),
      shot("s2", "f1"),
      shot("s3")
    ];
    expect(collectShotIdsToDelete(["f1"], items)).toEqual(
      new Set(["s1", "s2"])
    );
  });

  it("handles nested folders", () => {
    const items = [
      folder("f1"),
      folder("f2", "f1"),
      shot("s1", "f2"),
      shot("s2", "f1"),
      shot("orphan")
    ];
    expect(collectShotIdsToDelete(["f1"], items)).toEqual(
      new Set(["s1", "s2"])
    );
  });

  it("ignores unknown ids", () => {
    const items = [shot("s1")];
    expect(collectShotIdsToDelete(["s1", "missing"], items)).toEqual(
      new Set(["s1"])
    );
  });
});
