import {
  Img2ImgSchema,
  Img2ImgType
} from "@home/components/Navbar/Img2ImgModalV2/schemas";
import { describe, expect, it } from "vitest";

import { buildBulkRenderingDraftShotImageSettings } from "./buildBulkRenderingDraftShotImageSettings";

const masterImageSettings = Img2ImgSchema.parse({
  model: "gpt_image_2",
  frameType: "video",
  quality: "high",
  prompt: "master prompt"
}) as Img2ImgType;

describe("buildBulkRenderingDraftShotImageSettings", () => {
  it("keeps every master setting when the Shot uses the master model", () => {
    const settings = buildBulkRenderingDraftShotImageSettings({
      masterImageSettings,
      shotImageModel: "gpt_image_2",
      shotPrompt: "shot prompt",
      shotReferenceAssetIds: ["asset-1"]
    });

    expect(settings).toMatchObject({
      model: "gpt_image_2",
      quality: "high",
      prompt: "shot prompt",
      referenceImages: ["asset-1"]
    });
  });

  it("replaces the model-specific settings with the new model's defaults", () => {
    const settings = buildBulkRenderingDraftShotImageSettings({
      masterImageSettings,
      shotImageModel: "nanobanana_2",
      shotPrompt: "shot prompt",
      shotReferenceAssetIds: []
    });

    expect(settings.model).toBe("nanobanana_2");
    expect(settings).not.toHaveProperty("quality");
  });

  it("carries the Shot's prompt and references onto the new model", () => {
    const settings = buildBulkRenderingDraftShotImageSettings({
      masterImageSettings,
      shotImageModel: "qwen",
      shotPrompt: "a castle at dusk",
      shotReferenceAssetIds: ["asset-1", "asset-2"]
    });

    expect(settings).toMatchObject({
      model: "qwen",
      prompt: "a castle at dusk",
      referenceImages: ["asset-1", "asset-2"]
    });
  });

  it("preserves the master frameType when switching model", () => {
    const settings = buildBulkRenderingDraftShotImageSettings({
      masterImageSettings,
      shotImageModel: "seedream_5_pro",
      shotPrompt: "shot prompt",
      shotReferenceAssetIds: []
    });

    expect(settings.frameType).toBe("video");
  });

  it("never leaks the master model's mask selection onto another model", () => {
    const maskedMaster = Img2ImgSchema.parse({
      model: "gpt_image_2",
      frameType: "video",
      maskImages: ["mask-asset"]
    }) as Img2ImgType;

    const settings = buildBulkRenderingDraftShotImageSettings({
      masterImageSettings: maskedMaster,
      shotImageModel: "qwen",
      shotPrompt: "shot prompt",
      shotReferenceAssetIds: []
    });

    expect(settings).not.toMatchObject({ maskImages: ["mask-asset"] });
  });
});

describe("buildBulkRenderingDraftShotImageSettings in upload mode", () => {
  const uploadMaster = Img2ImgSchema.parse({
    model: "gpt_image_2",
    frameType: "upload",
    uploadedImageId: "uploaded-asset",
    prompt: "master prompt"
  }) as Img2ImgType;

  it("does not throw when the master settings are in upload mode", () => {
    expect(() =>
      buildBulkRenderingDraftShotImageSettings({
        masterImageSettings: uploadMaster,
        shotImageModel: "qwen",
        shotPrompt: "shot prompt",
        shotReferenceAssetIds: []
      })
    ).not.toThrow();
  });

  it("carries the uploaded image id onto the new model", () => {
    const settings = buildBulkRenderingDraftShotImageSettings({
      masterImageSettings: uploadMaster,
      shotImageModel: "qwen",
      shotPrompt: "shot prompt",
      shotReferenceAssetIds: []
    });

    expect(settings).toMatchObject({
      model: "qwen",
      frameType: "upload",
      uploadedImageId: "uploaded-asset"
    });
  });
});

describe("buildBulkRenderingDraftShotImageSettings with a per-Shot image setting override", () => {
  it("applies the touched setting on top of the master model's settings", () => {
    const settings = buildBulkRenderingDraftShotImageSettings({
      masterImageSettings,
      shotImageModel: "gpt_image_2",
      shotPrompt: "shot prompt",
      shotReferenceAssetIds: [],
      shotImageSettingKey: "quality",
      shotImageSettingValue: "medium"
    });

    expect(settings).toMatchObject({
      model: "gpt_image_2",
      quality: "medium"
    });
  });

  it("applies the touched setting on top of a switched model's defaults", () => {
    const settings = buildBulkRenderingDraftShotImageSettings({
      masterImageSettings,
      shotImageModel: "nanobanana_2",
      shotPrompt: "shot prompt",
      shotReferenceAssetIds: [],
      shotImageSettingKey: "resolution",
      shotImageSettingValue: "4K"
    });

    expect(settings).toMatchObject({
      model: "nanobanana_2",
      resolution: "4K"
    });
  });

  it("leaves the settings untouched when no setting value was given", () => {
    const settings = buildBulkRenderingDraftShotImageSettings({
      masterImageSettings,
      shotImageModel: "gpt_image_2",
      shotPrompt: "shot prompt",
      shotReferenceAssetIds: [],
      shotImageSettingKey: "quality",
      shotImageSettingValue: undefined
    });

    expect(settings).toMatchObject({ model: "gpt_image_2", quality: "high" });
  });
});
