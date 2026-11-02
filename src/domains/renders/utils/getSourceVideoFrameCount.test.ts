import { AssetType } from "@schemas/asset";
import { Layer } from "@schemas/layer";
import { describe, expect, it } from "vitest";

import { getSourceVideoFrameCount } from "./getSourceVideoFrameCount";

const makeTrack = (
  type: AssetType | undefined,
  totalFrames: number | undefined
): Layer =>
  ({
    id: `track-${type}-${totalFrames}`,
    clips: [
      {
        id: "clip",
        asset: {
          id: "asset",
          type,
          data: { duration: 50, total_frames: totalFrames }
        }
      }
    ]
  }) as unknown as Layer;

describe("getSourceVideoFrameCount", () => {
  it("reads the source track video's total frames, not the clip duration", () => {
    expect(
      getSourceVideoFrameCount(makeTrack(AssetType.VIDEO, 120), undefined)
    ).toBe(120);
  });

  it("falls back to the shot's video track when the source track holds an image", () => {
    expect(
      getSourceVideoFrameCount(
        makeTrack(AssetType.IMAGE, undefined),
        makeTrack(AssetType.VIDEO, 75)
      )
    ).toBe(75);
  });

  it("treats an asset without a type as a video", () => {
    expect(getSourceVideoFrameCount(makeTrack(undefined, 30), undefined)).toBe(
      30
    );
  });

  it("is unknown when no track holds a video frame count", () => {
    expect(getSourceVideoFrameCount(undefined, undefined)).toBeUndefined();
    expect(
      getSourceVideoFrameCount(makeTrack(AssetType.VIDEO, undefined), undefined)
    ).toBeUndefined();
  });
});
