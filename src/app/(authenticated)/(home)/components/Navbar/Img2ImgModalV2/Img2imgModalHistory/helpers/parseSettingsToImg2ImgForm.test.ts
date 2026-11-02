import { describe, expect, it } from "vitest";

import { parseSettingsToImg2ImgForm } from "./parseSettingsToImg2ImgForm";

const baseGptImage2Settings = {
  render_model: "gpt_image_2",
  reference_images: [],
  quality: "medium" as const,
  prompt: "test prompt"
};

describe("parseSettingsToImg2ImgForm", () => {
  it("restores the uploaded mask image from mask_image_id", () => {
    const result = parseSettingsToImg2ImgForm({
      ...baseGptImage2Settings,
      mask_image_id: "mask-asset-1"
    });

    if (result.model !== "gpt_image_2") {
      throw new Error("expected gpt_image_2");
    }
    expect(result.maskImages).toEqual(["mask-asset-1"]);
  });

  it("merges the inputImageOverride (frameType / uploadedImageId) into the result", () => {
    const result = parseSettingsToImg2ImgForm(baseGptImage2Settings, {
      frameType: "upload",
      uploadedImageId: "uploaded-1"
    });

    expect(result.frameType).toBe("upload");
    if (result.model !== "gpt_image_2" || result.frameType !== "upload") {
      throw new Error("expected gpt_image_2 + upload");
    }
    expect(result.uploadedImageId).toBe("uploaded-1");
  });
});
