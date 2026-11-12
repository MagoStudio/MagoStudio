import { describe, expect, it } from "vitest";

import { describeSceneStoryboardFromSheets } from "./describeSceneStoryboardFromSheets";

describe("describeSceneStoryboardFromSheets", () => {
  it("exposes the displayed legacy storyboard's clip and asset for its inputs popover and image cache", () => {
    const view = describeSceneStoryboardFromSheets({
      shotStoryboard: {
        latestStoryboardImage: undefined,
        isStoryboardRendering: false,
        hasLatestStoryboardRenderFailed: false,
        latestFinishedStoryboardImageUrl: "https://cdn.example/old.png",
        latestFinishedStoryboardClipId: "old-clip",
        latestFinishedStoryboardAssetId: "old-asset"
      },
      isStoryboardTaggedOnScene: true
    });
    expect(view).toMatchObject({
      imageClipId: "old-clip",
      imageAssetId: "old-asset",
      canListVersions: false
    });
  });
  it("reads a failed first storyboard as having no usable version", () => {
    const view = describeSceneStoryboardFromSheets({
      shotStoryboard: {
        latestStoryboardImage: {
          asset_id: "failed",
          clip_id: "failed-clip",
          status: "failed",
          source: "render",
          url: null,
          thumbnail_url: null,
          has_description: false
        },
        isStoryboardRendering: false,
        hasLatestStoryboardRenderFailed: true,
        latestFinishedStoryboardImageUrl: undefined
      },
      isStoryboardTaggedOnScene: false
    });
    expect(view).toMatchObject({
      hasNoUsableVersion: true,
      hasLastAttemptFailed: false,
      failedRenderClipId: "failed-clip",
      canListVersions: false
    });
  });
});
