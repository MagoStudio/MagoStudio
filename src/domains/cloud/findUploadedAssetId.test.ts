import { describe, expect, it } from "vitest";

import {
  findUploadedAssetId,
  findUploadedLayerId
} from "./findUploadedAssetId";

const timelineWithRenders = {
  video_url: "https://bucket.s3.amazonaws.com/key?sig=1",
  timeline: {
    layers: [
      {
        id: "source-layer",
        type: "IMAGE",
        created_at: "2026-10-01T10:00:00",
        clips: [{ asset: { id: "source-asset" } }]
      },
      {
        id: "render-layer",
        type: "RENDER",
        created_at: "2026-10-02T10:00:00",
        clips: [
          { asset: { id: "first-render-asset" } },
          { asset: { id: "second-render-asset" } }
        ]
      }
    ]
  }
};

describe("findUploadedAssetId", () => {
  it("reads the id out of the returned timeline, as staging returns it", () => {
    expect(
      findUploadedAssetId({
        timeline: {
          layers: [{ id: "layer", clips: [{ asset: { id: "cloud-asset" } }] }]
        }
      })
    ).toBe("cloud-asset");
  });

  it("picks the source asset on the first layer, as prod re-signs it, not a later render", () => {
    expect(findUploadedAssetId(timelineWithRenders)).toBe("source-asset");
    expect(findUploadedLayerId(timelineWithRenders, "source-asset")).toBe(
      "source-layer"
    );
  });

  it("takes the first clip of that layer that carries an asset", () => {
    expect(
      findUploadedAssetId({
        timeline: {
          layers: [
            {
              clips: [
                {
                  asset: {},
                  asset_id: "image-asset-the-response-filtered-out"
                },
                { asset: { id: "uploaded" } },
                { asset: { id: "later" } }
              ]
            }
          ]
        }
      })
    ).toBe("uploaded");
  });

  it("skips a leading layer that holds no asset", () => {
    expect(
      findUploadedAssetId({
        timeline: {
          layers: [{ clips: [] }, { clips: [{ asset: { id: "uploaded" } }] }]
        }
      })
    ).toBe("uploaded");
  });

  it("accepts a flat asset_id as well", () => {
    expect(
      findUploadedAssetId({
        timeline: { layers: [{ clips: [{ asset_id: "flat" }] }] }
      })
    ).toBe("flat");
  });

  it("returns null rather than guessing when nothing is there", () => {
    for (const response of [
      {},
      null,
      { timeline: {} },
      { timeline: { layers: [] } },
      { timeline: { layers: [{ clips: [] }] } },
      { timeline: { layers: [{ clips: [{ asset: {} }] }] } }
    ]) {
      expect(findUploadedAssetId(response)).toBeNull();
    }
  });
});
