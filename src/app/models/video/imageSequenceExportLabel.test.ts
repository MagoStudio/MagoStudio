import { describe, expect, it } from "vitest";

import { magoV1_0_0upscalerRenderModel } from "./magoV1_0_0upscalerRenderModel";
import { magoV2_0_0EsrganUpscalerRenderModel } from "./magoV2_0_0EsrganUpscalerRenderModel";
import { magoV3_4_0RenderModel } from "./magoV3_4_0VideoModel";
import { magoV4_0_0RenderModel } from "./magoV4_0_0VideoModel";
import { magoV4_1_0RenderModel } from "./magoV4_1_0VideoModel";
import { magoV5_0_0RenderModel } from "./magoV5_0_0VideoModel";
import { VideoModelDefinition } from "./types";
import { flattenSettingsGroups } from "./utils/flattenSettingsGroups";
import { v5_1_0InpaintingRenderModel } from "./v5_1_0InpaintingVideoModel";

const IMAGES_FORMAT_MODELS: Record<string, VideoModelDefinition> = {
  "Mago Transform (V3.4)": magoV3_4_0RenderModel,
  "Mago Style Transfer (V5.0)": magoV5_0_0RenderModel,
  "Mago Inpaint (V5.1)": v5_1_0InpaintingRenderModel,
  "Creative Upscaler (V1)": magoV1_0_0upscalerRenderModel,
  "Upscaler (V2 Esrgan)": magoV2_0_0EsrganUpscalerRenderModel,
  "Mago Character – chara only (V4.0)": magoV4_0_0RenderModel,
  "Mago Character – w/ background (V4.1)": magoV4_1_0RenderModel
};

const findImageSequenceExportSetting = (model: VideoModelDefinition) => {
  for (const section of flattenSettingsGroups(model)) {
    for (const setting of section.settings) {
      if (setting.key === "image_sequence_export") return setting;
    }
  }
  return undefined;
};

describe("Image sequence export label is identical across every supporting model", () => {
  it("every supporting model declares the setting", () => {
    for (const [modelDisplayName, model] of Object.entries(
      IMAGES_FORMAT_MODELS
    )) {
      expect(
        findImageSequenceExportSetting(model),
        modelDisplayName
      ).toBeDefined();
    }
  });

  it("no two supporting models label it differently", () => {
    const labels = Object.values(IMAGES_FORMAT_MODELS).map(
      (model) => findImageSequenceExportSetting(model)?.label
    );

    expect(new Set(labels).size).toBe(1);
  });
});
