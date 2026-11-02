import { CutShot } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import {
  countShotsWithFailedRenders,
  hasShotRenderFailed
} from "./summariseShotRenderState";

const version = (
  assetId: string,
  status: string,
  ready = false
): CutShot["versions"][number] => ({
  layer_id: `layer-${assetId}`,
  asset_id: assetId,
  name: assetId,
  ready,
  status,
  url: null,
  poster_url: null,
  upscale_of: null
});

const cutShot = (
  sequenceId: number,
  versions: CutShot["versions"]
): CutShot => ({
  timeline_id: `timeline-${sequenceId}`,
  shot_index: sequenceId - 1,
  sequence_id: sequenceId,
  heading: null,
  asset_id: versions.find((v) => v.ready)?.asset_id ?? null,
  pinned_asset_id: null,
  version_name: null,
  is_upscale: false,
  url: null,
  poster_url: null,
  versions
});

describe("hasShotRenderFailed", () => {
  it("is true when the only render errored", () => {
    expect(hasShotRenderFailed(cutShot(2, [version("a1", "error")]))).toBe(
      true
    );
  });

  it("is true for a cancelled render", () => {
    expect(hasShotRenderFailed(cutShot(2, [version("a1", "cancelled")]))).toBe(
      true
    );
  });

  it("is false while a render is still going, which used to look identical", () => {
    expect(hasShotRenderFailed(cutShot(2, [version("a1", "inprogress")]))).toBe(
      false
    );
    expect(hasShotRenderFailed(cutShot(2, [version("a1", "pending")]))).toBe(
      false
    );
  });

  it("is false when an earlier attempt failed but a later one succeeded", () => {
    expect(
      hasShotRenderFailed(
        cutShot(2, [version("a1", "error"), version("a2", "finished", true)])
      )
    ).toBe(false);
  });

  it("is false for a shot that has never been rendered", () => {
    expect(hasShotRenderFailed(cutShot(2, []))).toBe(false);
    expect(hasShotRenderFailed(undefined)).toBe(false);
  });
});

describe("countShotsWithFailedRenders", () => {
  it("counts only the shots stuck on a failure", () => {
    expect(
      countShotsWithFailedRenders([
        cutShot(2, [version("a1", "error")]),
        cutShot(3, [version("b1", "finished", true)]),
        cutShot(4, [version("c1", "inprogress")])
      ])
    ).toBe(1);
  });
});
