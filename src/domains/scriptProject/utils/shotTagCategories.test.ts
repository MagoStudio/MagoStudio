import { ShotTags } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import {
  getTagCategoryForSheetKind,
  withShotTagAdded,
  withShotTagRemoved
} from "./shotTagCategories";

const tags: ShotTags = {
  characters: ["sergeant", "medic"],
  environments: ["colony"],
  props: []
};

describe("getTagCategoryForSheetKind", () => {
  it("maps each cast kind to the tag group the shot uses", () => {
    expect(getTagCategoryForSheetKind("character")).toBe("characters");
    expect(getTagCategoryForSheetKind("environment")).toBe("environments");
    expect(getTagCategoryForSheetKind("prop")).toBe("props");
  });

  it("is null for an entity the backend gave no kind, which cannot be tagged", () => {
    expect(getTagCategoryForSheetKind(null)).toBeNull();
    expect(getTagCategoryForSheetKind(undefined)).toBeNull();
  });
});

describe("withShotTagRemoved", () => {
  it("drops only the named token from its own group", () => {
    const next = withShotTagRemoved(tags, "characters", "medic");

    expect(next.characters).toEqual(["sergeant"]);
    expect(next.environments).toEqual(["colony"]);
  });

  it("leaves the tags untouched when the token is not tagged", () => {
    expect(withShotTagRemoved(tags, "props", "rifle").props).toEqual([]);
  });

  it("does not mutate the tags it was given", () => {
    withShotTagRemoved(tags, "characters", "medic");
    expect(tags.characters).toEqual(["sergeant", "medic"]);
  });
});

describe("withShotTagAdded", () => {
  it("appends the token to its group", () => {
    expect(withShotTagAdded(tags, "props", "rifle").props).toEqual(["rifle"]);
  });

  it("never tags the same entity twice", () => {
    expect(withShotTagAdded(tags, "characters", "medic").characters).toEqual([
      "sergeant",
      "medic"
    ]);
  });

  it("does not mutate the tags it was given", () => {
    withShotTagAdded(tags, "props", "rifle");
    expect(tags.props).toEqual([]);
  });
});
