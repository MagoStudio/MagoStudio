import { describe, expect, it } from "vitest";

import { collectBulkRendersRunRequestImageAssetIds } from "./collectBulkRendersRunRequestImageAssetIds";

describe("collectBulkRendersRunRequestImageAssetIds", () => {
  it("collects supplied first frames and reference images once each", () => {
    expect(
      collectBulkRendersRunRequestImageAssetIds({
        project_id: "project-1",
        timeline_ids: ["shot-1", "shot-2", "shot-3"],
        img2img_settings: { reference_images: ["reference-1", ""] },
        shot_overrides: {
          "shot-1": {
            images: [{ asset_id: "first-frame-1", type: "reference_frame" }]
          },
          "shot-2": {
            img2img_settings: {
              reference_images: ["reference-1", "reference-2"]
            }
          },
          "shot-3": { video_settings: { prompt: "Walk" } }
        }
      })
    ).toEqual(["reference-1", "first-frame-1", "reference-2"]);
  });

  it("is empty for a run with no images", () => {
    expect(
      collectBulkRendersRunRequestImageAssetIds({
        project_id: "project-1",
        timeline_ids: ["shot-1"]
      })
    ).toEqual([]);
  });
});
