import type { ShotFolderOrShot } from "@domains/project/shotFolders/interface";
import { describe, expect, it } from "vitest";

import { collectAncestorIds } from "./collectAncestorIds";

const item = (id: string, parentFolderId = ""): ShotFolderOrShot => ({
  id,
  name: id,
  parentFolderId,
  type: "folder",
  createdAt: 0
});

describe("collectAncestorIds", () => {
  it("returns empty set for empty startParentId", () => {
    const map = new Map([["a", item("a")]]);
    expect(collectAncestorIds("", map).size).toBe(0);
  });

  it("returns single parent", () => {
    const map = new Map([["a", item("a")]]);
    expect(collectAncestorIds("a", map)).toEqual(new Set(["a"]));
  });

  it("traverses a chain of ancestors", () => {
    const map = new Map([
      ["a", item("a")],
      ["b", item("b", "a")],
      ["c", item("c", "b")]
    ]);
    expect(collectAncestorIds("c", map)).toEqual(new Set(["c", "b", "a"]));
  });

  it("stops on cycle", () => {
    const map = new Map([
      ["a", item("a", "b")],
      ["b", item("b", "a")]
    ]);
    const result = collectAncestorIds("a", map);
    expect(result.size).toBe(2);
    expect(result.has("a")).toBe(true);
    expect(result.has("b")).toBe(true);
  });

  it("stops when item not found in map", () => {
    const map = new Map([["a", item("a", "missing")]]);
    expect(collectAncestorIds("a", map)).toEqual(new Set(["a", "missing"]));
  });
});
