import {
  Img2ImgSchema,
  Img2ImgType
} from "@home/components/Navbar/Img2ImgModalV2/schemas";
import { describe, expect, it } from "vitest";

import { buildBulkRenderingDraftShotImageSettingsOverrides } from "./buildBulkRenderingDraftShotImageSettingsOverrides";

const settingsForModel = (model: Img2ImgType["model"]): Img2ImgType =>
  Img2ImgSchema.parse({ model, frameType: "video" }) as Img2ImgType;

describe("buildBulkRenderingDraftShotImageSettingsOverrides", () => {
  it("returns no override when no Shot is selected", () => {
    expect(
      buildBulkRenderingDraftShotImageSettingsOverrides({
        imageSettingsByShotId: {},
        defaultImageModel: "gpt_image_2"
      })
    ).toEqual({});
  });

  it("drops a Shot still on the master image model", () => {
    expect(
      buildBulkRenderingDraftShotImageSettingsOverrides({
        imageSettingsByShotId: { "shot-1": settingsForModel("gpt_image_2") },
        defaultImageModel: "gpt_image_2"
      })
    ).toEqual({});
  });

  it("keeps a Shot switched to another image model", () => {
    const overrides = buildBulkRenderingDraftShotImageSettingsOverrides({
      imageSettingsByShotId: {
        "shot-1": settingsForModel("seedream_5_pro"),
        "shot-2": settingsForModel("gpt_image_2")
      },
      defaultImageModel: "gpt_image_2"
    });

    expect(Object.keys(overrides)).toEqual(["shot-1"]);
    expect(overrides["shot-1"]).toMatchObject({ model: "seedream_5_pro" });
  });

  it("keeps every Shot when all of them differ from the master model", () => {
    const overrides = buildBulkRenderingDraftShotImageSettingsOverrides({
      imageSettingsByShotId: {
        "shot-1": settingsForModel("qwen"),
        "shot-2": settingsForModel("nanobanana_2")
      },
      defaultImageModel: "gpt_image_2"
    });

    expect(Object.keys(overrides)).toEqual(["shot-1", "shot-2"]);
  });

  it("keeps a Shot on the master model whose image setting was touched", () => {
    const shotSettings = {
      ...settingsForModel("gpt_image_2"),
      quality: "medium"
    } as Img2ImgType;
    const overrides = buildBulkRenderingDraftShotImageSettingsOverrides({
      imageSettingsByShotId: { "shot-1": shotSettings },
      defaultImageModel: "gpt_image_2",
      hasShotImageSettingOverrideById: { "shot-1": true }
    });

    expect(overrides).toEqual({ "shot-1": shotSettings });
  });

  it("drops a Shot on the master model whose image setting was not touched", () => {
    const overrides = buildBulkRenderingDraftShotImageSettingsOverrides({
      imageSettingsByShotId: { "shot-1": settingsForModel("gpt_image_2") },
      defaultImageModel: "gpt_image_2",
      hasShotImageSettingOverrideById: { "shot-1": false }
    });

    expect(overrides).toEqual({});
  });
});
