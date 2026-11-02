import { describe, expect, it } from "vitest";

import { modelAdapters } from "../adapters";

import { Img2ImgSchema, ModelSchemaMap } from "./index";

const REMOVED_MODELS = [
  "mago",
  "kontext",
  "nanobanana",
  "qwen_cr",
  "seedream"
] as const;

describe("Img2ImgSchema (removed models)", () => {
  it.each(REMOVED_MODELS)(
    "rejects a values object with model: '%s' with a discriminant error",
    (model) => {
      const result = Img2ImgSchema.safeParse({
        model,
        frameType: "video",
        prompt: "anything"
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const modelIssues = result.error.issues.filter((issue) =>
          issue.path.includes("model")
        );
        expect(modelIssues.length).toBeGreaterThan(0);
      }
    }
  );
});

describe("ModelSchemaMap (removed models)", () => {
  it.each(REMOVED_MODELS)(
    "does not expose '%s' as a selectable option",
    (model) => {
      expect(ModelSchemaMap).not.toHaveProperty(model);
    }
  );
});

describe("modelAdapters registry (removed models)", () => {
  it.each(REMOVED_MODELS)("does not register a '%s' adapter", (model) => {
    expect(modelAdapters).not.toHaveProperty(model);
  });
});
