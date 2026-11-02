import { describe, expect, it } from "vitest";

import { pickModelFallback } from "./modelFallback";

const models = [{ key: "seedance" }, { key: "local-model" }];
const getKey = (model: (typeof models)[number]) => model.key;

describe("pickModelFallback", () => {
  it("keeps a selection that is still available", () => {
    expect(pickModelFallback(models, "seedance", getKey)).toBeNull();
  });

  it("selects the first available model when the active one disappears", () => {
    expect(pickModelFallback(models.slice(1), "seedance", getKey)).toEqual({
      key: "local-model"
    });
  });

  it("does nothing when no model is available", () => {
    expect(pickModelFallback([], "seedance", getKey)).toBeNull();
  });
});
