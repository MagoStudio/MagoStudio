import { magoV3_3_0_cnetsRenderModel } from "@models/video/magoV3_3_0_cnetsVideoModel";
import { magoV5_0_0RenderModel } from "@models/video/magoV5_0_0VideoModel";
import { IMAGE_SEQUENCE_EXPORT, VideoSettings } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { formatBulkRendersRunVideoSettingsForBackend } from "./formatBulkRendersRunVideoSettingsForBackend";

describe("formatBulkRendersRunVideoSettingsForBackend", () => {
  it("runs the selected model's own FE-to-BE adapter, so Mago V5.0.0 drops retired lora keys and sends an empty custom_loras array", () => {
    const formattedSettings = formatBulkRendersRunVideoSettingsForBackend({
      videoSettings: { lora_1: 0.8, lora_4: 0.5, steps: 4 } as VideoSettings,
      videoModel: magoV5_0_0RenderModel,
      frameRange: [0, 48]
    });

    expect(formattedSettings.lora_1).toBeUndefined();
    expect(formattedSettings.lora_4).toBeUndefined();
    expect(formattedSettings.custom_loras).toEqual([]);
    expect(formattedSettings.skip_cnet_preprocess).toBe(true);
  });

  it("passes settings through unchanged for a model that declares no adapter", () => {
    const formattedSettings = formatBulkRendersRunVideoSettingsForBackend({
      videoSettings: { steps: 20, denoise: 0.5 } as VideoSettings,
      videoModel: magoV3_3_0_cnetsRenderModel,
      frameRange: [0, 48]
    });

    expect(formattedSettings.steps).toBe(20);
    expect(formattedSettings.denoise).toBe(0.5);
  });

  it("derives convert_exrs_to_pngs as false only when the export format is 16-bit EXR", () => {
    const exrSettings = formatBulkRendersRunVideoSettingsForBackend({
      videoSettings: {
        image_sequence_export: IMAGE_SEQUENCE_EXPORT.EXR_16BIT
      } as VideoSettings,
      videoModel: magoV3_3_0_cnetsRenderModel,
      frameRange: [0, 48]
    });
    const pngSettings = formatBulkRendersRunVideoSettingsForBackend({
      videoSettings: {
        image_sequence_export: IMAGE_SEQUENCE_EXPORT.PNG
      } as VideoSettings,
      videoModel: magoV3_3_0_cnetsRenderModel,
      frameRange: [0, 48]
    });

    expect(exrSettings.convert_exrs_to_pngs).toBe(false);
    expect(pngSettings.convert_exrs_to_pngs).toBe(true);
  });

  it("defaults convert_exrs_to_pngs to true when the panel supplies no export format", () => {
    const formattedSettings = formatBulkRendersRunVideoSettingsForBackend({
      videoSettings: { steps: 20 } as VideoSettings,
      videoModel: magoV3_3_0_cnetsRenderModel,
      frameRange: [0, 48]
    });

    expect(formattedSettings.convert_exrs_to_pngs).toBe(true);
  });
});
