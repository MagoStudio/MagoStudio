import { ModelSchemaMap } from "@home/components/Navbar/Img2ImgModalV2/schemas";
import { describe, expect, it } from "vitest";

import { getBulkRenderingImageSettingKeyForModel } from "./getBulkRenderingImageSettingKeyForModel";

const IMAGE_MODELS_WITH_NO_TUNABLE = new Set([
  "nanobanana_pro",
  "qwen",
  "seedream_5_pro"
]);

describe("getBulkRenderingImageSettingKeyForModel", () => {
  it("returns quality for GPT Image 2", () => {
    expect(getBulkRenderingImageSettingKeyForModel("gpt_image_2")).toBe(
      "quality"
    );
  });

  it("returns resolution for Nanobanana 2", () => {
    expect(getBulkRenderingImageSettingKeyForModel("nanobanana_2")).toBe(
      "resolution"
    );
  });

  it("returns undefined for the three models with no tunable setting", () => {
    expect(
      getBulkRenderingImageSettingKeyForModel("nanobanana_pro")
    ).toBeUndefined();
    expect(getBulkRenderingImageSettingKeyForModel("qwen")).toBeUndefined();
    expect(
      getBulkRenderingImageSettingKeyForModel("seedream_5_pro")
    ).toBeUndefined();
  });

  describe("against the real image-model list", () => {
    for (const model of Object.values(ModelSchemaMap)) {
      it(`makes an explicit decision for ${model.value}`, () => {
        const settingKey = getBulkRenderingImageSettingKeyForModel(model.value);

        if (IMAGE_MODELS_WITH_NO_TUNABLE.has(model.value)) {
          expect(settingKey).toBeUndefined();
        } else {
          expect(settingKey).toBeDefined();
        }
      });
    }

    it("covers every real model — the no-tunable allow-list and the tunable models together account for the whole list", () => {
      const tunableModels = Object.values(ModelSchemaMap).filter(
        (model) => !IMAGE_MODELS_WITH_NO_TUNABLE.has(model.value)
      );

      for (const model of tunableModels) {
        expect(
          getBulkRenderingImageSettingKeyForModel(model.value)
        ).toBeDefined();
      }
      expect(tunableModels.length + IMAGE_MODELS_WITH_NO_TUNABLE.size).toBe(
        Object.values(ModelSchemaMap).length
      );
    });
  });
});
