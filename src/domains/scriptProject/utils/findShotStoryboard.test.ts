import { SheetGroup, SheetImage } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { findShotStoryboard } from "./findShotStoryboard";

const SHOT_TIMELINE_ID = "918b3792-7240";

const storyboardImage = (
  overrides: Partial<SheetImage> & Pick<SheetImage, "asset_id" | "status">
): SheetImage => ({
  clip_id: `clip-${overrides.asset_id}`,
  source: "render",
  url: `https://cdn.example/${overrides.asset_id}.png`,
  thumbnail_url: null,
  has_description: false,
  ...overrides
});

const storyboardSheetGroup = (
  images: SheetImage[],
  isStoryboardOnScene = true
): SheetGroup =>
  ({
    token: "storyboard_918b3792_7240",
    name: "Storyboard",
    enabled: isStoryboardOnScene,
    layer_id: "layer-1",
    layer_order: 0,
    selected_asset_id: null,
    effective_asset_id: null,
    effective_source: null,
    images
  }) as SheetGroup;

describe("findShotStoryboard", () => {
  it("shows the newest finished image", () => {
    const storyboard = findShotStoryboard(
      [
        storyboardSheetGroup([
          storyboardImage({
            asset_id: "old",
            status: "success",
            created_at: "2026-10-06T10:00:00Z"
          }),
          storyboardImage({
            asset_id: "new",
            status: "success",
            created_at: "2026-10-06T11:00:00Z"
          })
        ])
      ],
      SHOT_TIMELINE_ID
    );

    expect(storyboard.latestFinishedStoryboardImageUrl).toBe(
      "https://cdn.example/new.png"
    );
    expect(storyboard.isStoryboardRendering).toBe(false);
    expect(storyboard.latestFinishedStoryboardClipId).toBe("clip-new");
    expect(storyboard.latestFinishedStoryboardAssetId).toBe("new");
  });

  it("reports a regeneration in progress while still showing the previous image", () => {
    const storyboard = findShotStoryboard(
      [
        storyboardSheetGroup([
          storyboardImage({
            asset_id: "old",
            status: "success",
            created_at: "2026-10-06T10:00:00Z"
          }),
          storyboardImage({
            asset_id: "new",
            status: "processing",
            url: null,
            created_at: "2026-10-06T11:00:00Z"
          })
        ])
      ],
      SHOT_TIMELINE_ID
    );

    expect(storyboard.isStoryboardRendering).toBe(true);
    expect(storyboard.latestFinishedStoryboardClipId).toBe("clip-old");
    expect(storyboard.latestFinishedStoryboardAssetId).toBe("old");
    expect(storyboard.latestFinishedStoryboardImageUrl).toBe(
      "https://cdn.example/old.png"
    );
  });

  it("finds nothing for a Shot that has no storyboard", () => {
    expect(findShotStoryboard([], SHOT_TIMELINE_ID)).toEqual({
      latestStoryboardImage: undefined,
      isStoryboardRendering: false,
      hasLatestStoryboardRenderFailed: false,
      latestFinishedStoryboardImageUrl: undefined,
      latestFinishedStoryboardClipId: undefined,
      latestFinishedStoryboardAssetId: undefined
    });
  });

  it("reports a failed newest storyboard while still showing the previous image", () => {
    const storyboard = findShotStoryboard(
      [
        storyboardSheetGroup([
          storyboardImage({
            asset_id: "old",
            status: "success",
            created_at: "2026-10-06T10:00:00Z"
          }),
          storyboardImage({
            asset_id: "new",
            status: "failed",
            url: null,
            created_at: "2026-10-06T11:00:00Z"
          })
        ])
      ],
      SHOT_TIMELINE_ID
    );

    expect(storyboard.hasLatestStoryboardRenderFailed).toBe(true);
    expect(storyboard.latestFinishedStoryboardImageUrl).toBe(
      "https://cdn.example/old.png"
    );
  });

  it("does not report a failure once a newer storyboard succeeds", () => {
    const storyboard = findShotStoryboard(
      [
        storyboardSheetGroup([
          storyboardImage({
            asset_id: "failed",
            status: "failed",
            url: null,
            created_at: "2026-10-06T10:00:00Z"
          }),
          storyboardImage({
            asset_id: "retry",
            status: "success",
            created_at: "2026-10-06T11:00:00Z"
          })
        ])
      ],
      SHOT_TIMELINE_ID
    );

    expect(storyboard.hasLatestStoryboardRenderFailed).toBe(false);
  });
  it("shows no storyboard once it has been removed from the scene", () => {
    const storyboard = findShotStoryboard(
      [
        storyboardSheetGroup(
          [
            storyboardImage({
              asset_id: "removed",
              status: "success",
              created_at: "2026-10-01T10:00:00Z"
            })
          ],
          false
        )
      ],
      SHOT_TIMELINE_ID
    );

    expect(storyboard.latestFinishedStoryboardImageUrl).toBeUndefined();
  });

  it("treats an image with no creation time yet as the latest render", () => {
    const storyboard = findShotStoryboard(
      [
        storyboardSheetGroup([
          storyboardImage({
            asset_id: "finished",
            status: "success",
            created_at: "2026-10-06T10:00:00Z"
          }),
          storyboardImage({
            asset_id: "just-submitted",
            status: "processing",
            created_at: null
          })
        ])
      ],
      SHOT_TIMELINE_ID
    );

    expect(storyboard.latestStoryboardImage?.asset_id).toBe("just-submitted");
    expect(storyboard.isStoryboardRendering).toBe(true);
  });
});
