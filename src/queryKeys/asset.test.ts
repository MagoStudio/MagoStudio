import { describe, expect, it } from "vitest";

import { imageAssetBatch } from "./asset";

describe("asset query keys", () => {
  it("adds no undefined placeholder when the batch is empty", () => {
    expect(imageAssetBatch.forIds([])).toHaveLength(1);
  });

  it("gives two different id sets two different keys", () => {
    expect(imageAssetBatch.forIds(["a1"])).not.toEqual(
      imageAssetBatch.forIds(["a1", "a2"])
    );
  });
});
