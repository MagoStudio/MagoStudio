import { describe, expect, it } from "vitest";

import { describeSceneStoryboardFromSheets } from "./describeSceneStoryboardFromSheets";

describe("describeSceneStoryboardFromSheets", () => {
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
