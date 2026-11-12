import { CutShot, ProjectCutSchema } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { resolveCutShotVideo } from "./resolveCutShotVideo";

const RAW_PINNED_URL = "https://signed/pinned-render.mp4";
const DUBBED_URL = "https://signed/dubbed-scene.mp4";

const cutShot = ({
  isSceneHiddenUntilDubLands,
  ...overrides
}: {
  isSceneHiddenUntilDubLands?: boolean;
  [field: string]: unknown;
}): CutShot => ({
  ...ProjectCutSchema.parse({
    project_id: "project",
    shots: [
      {
        timeline_id: "scene",
        shot_index: 0,
        sequence_id: 1,
        asset_id: "pinned",
        url: DUBBED_URL,
        mixed_asset_id: "dub",
        versions: [{ layer_id: "l1", asset_id: "pinned", url: RAW_PINNED_URL }],
        ...overrides
      }
    ]
  }).shots[0],
  isSceneHiddenUntilDubLands
});

describe("resolveCutShotVideo", () => {
  it("keys the dubbed scene on the dub, never on the version it was made over", () => {
    expect(resolveCutShotVideo(cutShot({}))).toEqual({
      videoUrl: DUBBED_URL,
      videoAssetId: "dub",
      posterUrl: null
    });
  });

  it("keys a scene with no dub on its version", () => {
    expect(
      resolveCutShotVideo(
        cutShot({ mixed_asset_id: null, url: RAW_PINNED_URL })
      )
    ).toEqual({
      videoUrl: RAW_PINNED_URL,
      videoAssetId: "pinned",
      posterUrl: null
    });
  });

  it("has no key while the scene has no render", () => {
    expect(
      resolveCutShotVideo(
        cutShot({ mixed_asset_id: null, asset_id: null, url: null })
      )
    ).toEqual({ videoUrl: null, videoAssetId: null, posterUrl: null });
  });

  it("shows nothing of the scene while it is being dubbed", () => {
    expect(
      resolveCutShotVideo(
        cutShot({
          mixed_asset_id: null,
          url: RAW_PINNED_URL,
          poster_url: "https://signed/pinned-render.jpg",
          isSceneHiddenUntilDubLands: true
        })
      )
    ).toEqual({ videoUrl: null, videoAssetId: null, posterUrl: null });
  });
});
