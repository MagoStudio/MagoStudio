import { ShotFolderOrShot } from "@domains/project/shotFolders/interface";
import { describe, expect, it } from "vitest";

import { computeLeafShotCount } from "./computeLeafShotCount";

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

describe("computeLeafShotCount", () => {
  it("counts standalone shots one-for-one", () => {
    const items = [shot("s1"), shot("s2")];
    expect(computeLeafShotCount(["s1", "s2"], items)).toBe(2);
  });

  it("expands a folder into its descendant shots", () => {
    const items = [folder("F"), shot("s1", "F"), shot("s2", "F")];
    expect(computeLeafShotCount(["F"], items)).toBe(2);
  });

  it("recurses through nested folders", () => {
    const items = [
      folder("F1"),
      folder("F2", "F1"),
      shot("a", "F2"),
      shot("b", "F2")
    ];
    expect(computeLeafShotCount(["F1"], items)).toBe(2);
  });

  it("dedupes when a folder and one of its child shots are both passed", () => {
    const items = [folder("F"), shot("s1", "F"), shot("s2", "F")];
    expect(computeLeafShotCount(["F", "s1"], items)).toBe(2);
  });

  it("ignores ids that are not in the item set", () => {
    const items = [shot("s1")];
    expect(computeLeafShotCount(["ghost", "s1"], items)).toBe(1);
  });

  it("returns 0 for an empty selection", () => {
    expect(computeLeafShotCount([], [shot("s1")])).toBe(0);
  });

  it("returns 0 for a folder with no shots inside", () => {
    const items = [folder("F"), folder("F2", "F")];
    expect(computeLeafShotCount(["F"], items)).toBe(0);
  });
});
