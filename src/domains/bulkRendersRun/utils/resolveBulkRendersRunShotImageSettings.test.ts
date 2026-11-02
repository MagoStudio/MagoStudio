import { describe, expect, it } from "vitest";

import { resolveBulkRendersRunShotImageSettings } from "./resolveBulkRendersRunShotImageSettings";

describe("resolveBulkRendersRunShotImageSettings", () => {
  it("uses the run-level settings for a Shot with no override", () => {
    const settings = resolveBulkRendersRunShotImageSettings({
      shotId: "shot-1",
      runImg2ImgSettings: {
        prompt: "a run-level prompt",
        render_model: "gpt-image-2",
        reference_images: ["run-reference-asset"]
      },
      shotOverridesById: undefined
    });

    expect(settings).toEqual({
      prompt: "a run-level prompt",
      model: "gpt-image-2",
      referenceAssetIds: ["run-reference-asset"]
    });
  });

  it("uses the Shot's own override when it overrode its prompt, model and references", () => {
    const settings = resolveBulkRendersRunShotImageSettings({
      shotId: "shot-1",
      runImg2ImgSettings: {
        prompt: "a run-level prompt",
        render_model: "gpt-image-2",
        reference_images: ["run-reference-asset"]
      },
      shotOverridesById: {
        "shot-1": {
          img2img_settings: {
            prompt: "a Shot-specific prompt",
            render_model: "gpt-image-1",
            reference_images: ["shot-reference-asset"]
          }
        }
      }
    });

    expect(settings).toEqual({
      prompt: "a Shot-specific prompt",
      model: "gpt-image-1",
      referenceAssetIds: ["shot-reference-asset"]
    });
  });

  it("falls back to the run-level references when the Shot overrode only its prompt", () => {
    const settings = resolveBulkRendersRunShotImageSettings({
      shotId: "shot-1",
      runImg2ImgSettings: {
        prompt: "a run-level prompt",
        render_model: "gpt-image-2",
        reference_images: ["run-reference-asset"]
      },
      shotOverridesById: {
        "shot-1": {
          img2img_settings: {
            prompt: "a Shot-specific prompt"
          }
        }
      }
    });

    expect(settings).toEqual({
      prompt: "a Shot-specific prompt",
      model: "gpt-image-2",
      referenceAssetIds: ["run-reference-asset"]
    });
  });

  it("resolves to no references when neither the run nor the Shot supplied any", () => {
    const settings = resolveBulkRendersRunShotImageSettings({
      shotId: "shot-1",
      runImg2ImgSettings: undefined,
      shotOverridesById: undefined
    });

    expect(settings).toEqual({
      prompt: undefined,
      model: undefined,
      referenceAssetIds: []
    });
  });
});
