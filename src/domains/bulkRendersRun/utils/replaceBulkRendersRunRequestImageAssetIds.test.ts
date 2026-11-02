import { describe, expect, it } from "vitest";

import { replaceBulkRendersRunRequestImageAssetIds } from "./replaceBulkRendersRunRequestImageAssetIds";

describe("replaceBulkRendersRunRequestImageAssetIds", () => {
  const cloudAssetIdByLocalAssetId = new Map([
    ["first-frame-1", "cloud-first-frame-1"],
    ["reference-1", "cloud-reference-1"]
  ]);

  it("swaps every supplied first frame and reference image id", () => {
    expect(
      replaceBulkRendersRunRequestImageAssetIds(
        {
          project_id: "project-1",
          timeline_ids: ["shot-1", "shot-2"],
          img2img_settings: {
            prompt: "Portrait",
            reference_images: ["reference-1"]
          },
          shot_overrides: {
            "shot-1": {
              images: [{ asset_id: "first-frame-1", type: "reference_frame" }],
              video_settings: { prompt: "Walk" }
            },
            "shot-2": {
              img2img_settings: { reference_images: ["reference-1"] }
            }
          }
        },
        cloudAssetIdByLocalAssetId
      )
    ).toEqual({
      project_id: "project-1",
      timeline_ids: ["shot-1", "shot-2"],
      img2img_settings: {
        prompt: "Portrait",
        reference_images: ["cloud-reference-1"]
      },
      shot_overrides: {
        "shot-1": {
          images: [
            { asset_id: "cloud-first-frame-1", type: "reference_frame" }
          ],
          video_settings: { prompt: "Walk" }
        },
        "shot-2": {
          img2img_settings: { reference_images: ["cloud-reference-1"] }
        }
      }
    });
  });

  it("keeps ids that have no replacement and adds no keys", () => {
    const request = {
      project_id: "project-1",
      timeline_ids: ["shot-1"],
      shot_overrides: {
        "shot-1": {
          images: [
            { asset_id: "already-cloud", type: "reference_frame" as const }
          ]
        }
      }
    };

    expect(
      replaceBulkRendersRunRequestImageAssetIds(
        request,
        cloudAssetIdByLocalAssetId
      )
    ).toEqual(request);
  });
});
