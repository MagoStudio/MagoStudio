import { describe, expect, it } from "vitest";

import { shouldDeleteProjectAfter } from "./shouldDeleteProjectAfter";

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

describe("shouldDeleteProjectAfter", () => {
  it("returns true when every shot is selected directly", () => {
    const items = [shot("s1"), shot("s2"), shot("s3")];
    expect(shouldDeleteProjectAfter(["s1", "s2", "s3"], items)).toBe(true);
  });

  it("returns true when a single folder covers every shot", () => {
    const items = [folder("f1"), shot("s1", "f1"), shot("s2", "f1")];
    expect(shouldDeleteProjectAfter(["f1"], items)).toBe(true);
  });

  it("returns true for a mixed shot + folder selection that covers all shots", () => {
    const items = [
      folder("f1"),
      shot("s1", "f1"),
      shot("s2", "f1"),
      shot("loose")
    ];
    expect(shouldDeleteProjectAfter(["f1", "loose"], items)).toBe(true);
  });

  it("returns false on partial selection", () => {
    const items = [shot("s1"), shot("s2"), shot("s3")];
    expect(shouldDeleteProjectAfter(["s1", "s2"], items)).toBe(false);
  });

  it("returns false when allItems has no shots", () => {
    expect(shouldDeleteProjectAfter([], [])).toBe(false);
    expect(shouldDeleteProjectAfter(["f1"], [folder("f1")])).toBe(false);
  });

  it("ignores ids not present in allItems", () => {
    const items = [shot("s1"), shot("s2")];
    expect(shouldDeleteProjectAfter(["s1", "missing"], items)).toBe(false);
    expect(shouldDeleteProjectAfter(["s1", "s2", "missing"], items)).toBe(true);
  });

  it("returns true when the folder selection includes nested folders covering all shots", () => {
    const items = [
      folder("root"),
      folder("nested", "root"),
      shot("s1", "nested"),
      shot("s2", "root")
    ];
    expect(shouldDeleteProjectAfter(["root"], items)).toBe(true);
  });

  it("returns false when only a single shot among many is selected (the last-shot regression guard inverse)", () => {
    const items = [shot("s1"), shot("s2")];
    expect(shouldDeleteProjectAfter(["s1"], items)).toBe(false);
  });

  it("returns false when a folder is selected but a sibling shot outside the folder is not", () => {
    const items = [
      folder("f1"),
      shot("s1", "f1"),
      shot("s2", "f1"),
      shot("sibling")
    ];
    expect(shouldDeleteProjectAfter(["f1"], items)).toBe(false);
  });
});
