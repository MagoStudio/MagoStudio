import { ImageAssetResponse } from "@domains/asset/interface";
import { Layer } from "@schemas/layer";
import { createAsset } from "@tests/factories/asset";
import { createClip } from "@tests/factories/clip";
import { createLayer } from "@tests/factories/layer";
import { describe, expect, test } from "vitest";

import { buildImageToVideoPrefillSettings } from "./buildImageToVideoPrefillSettings";

const START_IMAGE_ASSET_ID = "start-image-asset-id";

const buildRenderWithStartImage = (): Layer => {
  const asset = createAsset({
    data: {
      origin: "generated",
      fps: 24,
      duration: 1000,
      size: [1920, 1080],
      renderEngine: "magov2",
      data: {
        render_settings: {
          magov2: {
            prompt: "A cat walking through a garden",
            image_id: START_IMAGE_ASSET_ID,
            durationInSeconds: 5,
            fps: 24,
            resolution: "720p"
          }
        }
      }
    }
  });
  const clip = createClip({ asset });
  return createLayer({ clips: [clip] });
};

describe("buildImageToVideoPrefillSettings", () => {
  test("clears the start image reference when its asset no longer exists", () => {
    const render = buildRenderWithStartImage();

    const prefillSettings = buildImageToVideoPrefillSettings(render, undefined);

    expect(prefillSettings?.image_id).toBeUndefined();
    expect(prefillSettings?.prompt).toBe("A cat walking through a garden");
    expect(prefillSettings?.durationInSeconds).toBe(5);
  });

  test("keeps the start image reference when its asset still exists", () => {
    const render = buildRenderWithStartImage();
    const startImageAsset: ImageAssetResponse = {
      s3_url: "https://example.com/start-image.png",
      urlToUse: "https://example.com/start-image.png",
      asset: {
        id: START_IMAGE_ASSET_ID,
        name: "start-frame.png",
        data: { duration: 0, thumbnail_filepath: "" },
        rate: 0,
        user_id: "test-user-id",
        filepath: "mock-assets/start-frame.png",
        type: "image",
        created_at: new Date().toISOString()
      }
    };

    const prefillSettings = buildImageToVideoPrefillSettings(
      render,
      startImageAsset
    );

    expect(prefillSettings?.image_id).toBe(START_IMAGE_ASSET_ID);
  });

  test("returns undefined when the render has no output asset yet", () => {
    const render = createLayer({ clips: [] });

    const prefillSettings = buildImageToVideoPrefillSettings(render, undefined);

    expect(prefillSettings).toBeUndefined();
  });
});
