import { describe, expect, it } from "vitest";

import { mergeFolderTreeItems } from "./mergeFolderTreeItems";

type TestItem = {
  id: string;
  name: string;
  parentFolderId: string;
  type: "folder" | "shot";
  createdAt: number;
};

const folder = (id: string, parentFolderId = ""): TestItem => ({
  id,
  name: id,
  parentFolderId,
  type: "folder",
  createdAt: 1
});

const shot = (id: string, parentFolderId = ""): TestItem => ({
  id,
  name: id,
  parentFolderId,
  type: "shot",
  createdAt: 1
});

describe("mergeFolderTreeItems", () => {
  it("returns mine when the cloud has not changed since Local read it", () => {
    const base = [folder("f1"), shot("s1"), shot("s2", "f1")];
    const mine = [
      folder("f1"),
      { ...shot("s1", "f1"), name: "renamed" },
      folder("f2", "f1")
    ];
    expect(mergeFolderTreeItems({ base, mine, theirs: base })).toEqual(mine);
  });

  it("keeps items added concurrently on both sides", () => {
    expect(
      mergeFolderTreeItems({
        base: [folder("f1")],
        mine: [folder("f1"), shot("local", "f1")],
        theirs: [folder("f1"), shot("cloud")]
      })
    ).toEqual([folder("f1"), shot("cloud"), shot("local", "f1")]);
  });

  it("keeps the cloud's copy when both sides added the same id", () => {
    expect(
      mergeFolderTreeItems({
        base: [folder("f1")],
        mine: [folder("f1"), shot("s1")],
        theirs: [folder("f1"), shot("s1", "f1")]
      })
    ).toEqual([folder("f1"), shot("s1", "f1")]);
  });

  it("removes an item removed on both sides", () => {
    expect(
      mergeFolderTreeItems({
        base: [shot("s1"), shot("s2")],
        mine: [shot("s2")],
        theirs: [shot("s2")]
      })
    ).toEqual([shot("s2")]);
  });

  it("removes an item removed locally even after the cloud moved it", () => {
    expect(
      mergeFolderTreeItems({
        base: [folder("f1"), shot("s1")],
        mine: [folder("f1")],
        theirs: [folder("f1"), shot("s1", "f1")]
      })
    ).toEqual([folder("f1")]);
  });

  it("keeps an item deleted in the cloud deleted while Local moved it", () => {
    expect(
      mergeFolderTreeItems({
        base: [folder("f1"), shot("s1")],
        mine: [folder("f1"), shot("s1", "f1")],
        theirs: [folder("f1")]
      })
    ).toEqual([folder("f1")]);
  });

  it("applies a local move and a cloud rename of the same item", () => {
    expect(
      mergeFolderTreeItems({
        base: [folder("f1"), shot("s1")],
        mine: [folder("f1"), shot("s1", "f1")],
        theirs: [folder("f1"), { ...shot("s1"), name: "cloud name" }]
      })
    ).toEqual([folder("f1"), { ...shot("s1", "f1"), name: "cloud name" }]);
  });

  it("lets a local move win over a concurrent cloud move", () => {
    expect(
      mergeFolderTreeItems({
        base: [folder("f1"), folder("f2"), shot("s1")],
        mine: [folder("f1"), folder("f2"), shot("s1", "f1")],
        theirs: [folder("f1"), folder("f2"), shot("s1", "f2")]
      })
    ).toEqual([folder("f1"), folder("f2"), shot("s1", "f1")]);
  });

  it("follows the cloud for items Local did not touch", () => {
    expect(
      mergeFolderTreeItems({
        base: [folder("f1"), shot("s1"), shot("s2")],
        mine: [folder("f1"), shot("s1", "f1"), shot("s2")],
        theirs: [folder("f1"), shot("s1"), { ...shot("s2", "f1"), name: "x" }]
      })
    ).toEqual([
      folder("f1"),
      shot("s1", "f1"),
      { ...shot("s2", "f1"), name: "x" }
    ]);
  });

  it("puts a local addition at the root when its folder was deleted in the cloud", () => {
    expect(
      mergeFolderTreeItems({
        base: [folder("f1")],
        mine: [folder("f1"), folder("f2", "f1")],
        theirs: []
      })
    ).toEqual([folder("f2")]);
  });

  it("puts a local move at the root when its target folder was deleted in the cloud", () => {
    expect(
      mergeFolderTreeItems({
        base: [folder("f1"), shot("s1")],
        mine: [folder("f1"), shot("s1", "f1")],
        theirs: [shot("s1")]
      })
    ).toEqual([shot("s1")]);
  });

  it("puts a cloud addition at the root when Local deleted its folder", () => {
    expect(
      mergeFolderTreeItems({
        base: [folder("f1"), shot("s1", "f1")],
        mine: [],
        theirs: [folder("f1"), shot("s1", "f1"), shot("cloud", "f1")]
      })
    ).toEqual([shot("cloud")]);
  });

  it("leaves a dangling parent the cloud already had untouched", () => {
    expect(
      mergeFolderTreeItems({
        base: [shot("s1", "ghost")],
        mine: [shot("s1", "ghost"), shot("s2")],
        theirs: [shot("s1", "ghost")]
      })
    ).toEqual([shot("s1", "ghost"), shot("s2")]);
  });

  it("puts a locally moved folder at the root when a concurrent cloud move would form a cycle", () => {
    expect(
      mergeFolderTreeItems({
        base: [folder("a"), folder("b")],
        mine: [folder("a", "b"), folder("b")],
        theirs: [folder("a"), folder("b", "a")]
      })
    ).toEqual([folder("a"), folder("b", "a")]);
  });

  it("drops duplicate ids, keeping the first occurrence", () => {
    expect(
      mergeFolderTreeItems({
        base: [shot("s1"), shot("s1", "f1")],
        mine: [shot("s1"), shot("s2"), shot("s2")],
        theirs: [shot("s1"), shot("s1", "f1")]
      })
    ).toEqual([shot("s1"), shot("s2")]);
  });

  it("preserves extra fields the cloud stores on an item", () => {
    const cloudProject = {
      ...shot("p1"),
      shared_group_id: "group"
    };
    expect(
      mergeFolderTreeItems({
        base: [folder("f1"), shot("p1")],
        mine: [folder("f1"), shot("p1", "f1")],
        theirs: [folder("f1"), cloudProject]
      })
    ).toEqual([folder("f1"), { ...cloudProject, parentFolderId: "f1" }]);
  });
});
