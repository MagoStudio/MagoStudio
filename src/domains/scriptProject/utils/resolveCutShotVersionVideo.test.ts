import { CutShot, ProjectCutSchema } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { resolveCutShotVersionVideo } from "./resolveCutShotVersionVideo";

const RAW_PINNED_URL = "https://signed/pinned-render.mp4";
const RAW_OTHER_URL = "https://signed/other-render.mp4";
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
        versions: [
          { layer_id: "l1", asset_id: "pinned", url: RAW_PINNED_URL },
          { layer_id: "l2", asset_id: "other", url: RAW_OTHER_URL }
        ],
        ...overrides
      }
    ]
  }).shots[0],
  isSceneHiddenUntilDubLands
});

const DUBBED_VIDEO = {
  videoUrl: DUBBED_URL,
  videoAssetId: "dub",
  posterUrl: null
};
const RAW_PINNED_VIDEO = {
  videoUrl: RAW_PINNED_URL,
  videoAssetId: "pinned",
  posterUrl: null
};
const RAW_OTHER_VIDEO = {
  videoUrl: RAW_OTHER_URL,
  videoAssetId: "other",
  posterUrl: null
};

describe("resolveCutShotVersionVideo", () => {
  it("plays the dubbed scene for the version the dub was made over", () => {
    const shot = cutShot({});
    expect(resolveCutShotVersionVideo(shot, shot.versions[0])).toEqual(
      DUBBED_VIDEO
    );
  });

  it("plays another version's own render", () => {
    const shot = cutShot({});
    expect(resolveCutShotVersionVideo(shot, shot.versions[1])).toEqual(
      RAW_OTHER_VIDEO
    );
  });

  it("plays the render of a scene that has no dub", () => {
    const shot = cutShot({ mixed_asset_id: null, url: RAW_PINNED_URL });
    expect(resolveCutShotVersionVideo(shot, shot.versions[0])).toEqual(
      RAW_PINNED_VIDEO
    );
  });

  it("plays the dubbed scene for an explicitly pinned version", () => {
    const shot = cutShot({ pinned_asset_id: "pinned" });
    expect(resolveCutShotVersionVideo(shot, shot.versions[0])).toEqual(
      DUBBED_VIDEO
    );
  });

  it("plays the dubbed scene for the cut's version when nothing is pinned", () => {
    const shot = cutShot({ pinned_asset_id: null });
    expect(resolveCutShotVersionVideo(shot, shot.versions[0])).toEqual(
      DUBBED_VIDEO
    );
  });

  it("plays the render while the dubbed scene has no url", () => {
    const shot = cutShot({ url: null });
    expect(resolveCutShotVersionVideo(shot, shot.versions[0])).toEqual(
      RAW_PINNED_VIDEO
    );
  });

  it("follows the cut's version when the pin moves", () => {
    const shot = cutShot({ asset_id: "other", pinned_asset_id: "other" });
    expect(resolveCutShotVersionVideo(shot, shot.versions[1])).toEqual(
      DUBBED_VIDEO
    );
    expect(resolveCutShotVersionVideo(shot, shot.versions[0])).toEqual(
      RAW_PINNED_VIDEO
    );
  });

  it("shows nothing of a version waiting for its dub", () => {
    const shot = cutShot({
      mixed_asset_id: null,
      url: RAW_PINNED_URL,
      versions: [
        {
          layer_id: "l1",
          asset_id: "pinned",
          url: RAW_PINNED_URL,
          awaiting_dub: true
        },
        { layer_id: "l2", asset_id: "other", url: RAW_OTHER_URL }
      ]
    });
    expect(resolveCutShotVersionVideo(shot, shot.versions[0])).toEqual({
      videoUrl: null,
      videoAssetId: null,
      posterUrl: null
    });
  });

  it("plays another version's own render while one is waiting for its dub", () => {
    const shot = cutShot({
      versions: [
        {
          layer_id: "l1",
          asset_id: "pinned",
          url: RAW_PINNED_URL,
          awaiting_dub: true
        },
        { layer_id: "l2", asset_id: "other", url: RAW_OTHER_URL }
      ]
    });
    expect(resolveCutShotVersionVideo(shot, shot.versions[1])).toEqual(
      RAW_OTHER_VIDEO
    );
  });

  it("plays a version that is not the cut's with its own dub", () => {
    const otherDubUrl = "https://signed/other-dub.mp4";
    const shot = cutShot({
      versions: [
        { layer_id: "l1", asset_id: "pinned", url: RAW_PINNED_URL },
        {
          layer_id: "l2",
          asset_id: "other",
          url: RAW_OTHER_URL,
          mixed_url: otherDubUrl,
          mixed_asset_id: "other-dub"
        }
      ]
    });
    expect(resolveCutShotVersionVideo(shot, shot.versions[1])).toEqual({
      videoUrl: otherDubUrl,
      videoAssetId: "other-dub",
      posterUrl: null
    });
  });

  it("plays a version's own render when it has no dub of its own", () => {
    const shot = cutShot({
      versions: [
        { layer_id: "l1", asset_id: "pinned", url: RAW_PINNED_URL },
        {
          layer_id: "l2",
          asset_id: "other",
          url: RAW_OTHER_URL,
          mixed_url: null,
          mixed_asset_id: null
        }
      ]
    });
    expect(resolveCutShotVersionVideo(shot, shot.versions[1])).toEqual(
      RAW_OTHER_VIDEO
    );
  });

  it("plays a version's own render when its dub has a url but no asset id", () => {
    const shot = cutShot({
      versions: [
        { layer_id: "l1", asset_id: "pinned", url: RAW_PINNED_URL },
        {
          layer_id: "l2",
          asset_id: "other",
          url: RAW_OTHER_URL,
          mixed_url: "https://signed/other-dub.mp4",
          mixed_asset_id: null
        }
      ]
    });
    expect(resolveCutShotVersionVideo(shot, shot.versions[1])).toEqual(
      RAW_OTHER_VIDEO
    );
  });

  it("plays a version's own render when its dub url is not https", () => {
    const shot = cutShot({
      versions: [
        { layer_id: "l1", asset_id: "pinned", url: RAW_PINNED_URL },
        {
          layer_id: "l2",
          asset_id: "other",
          url: RAW_OTHER_URL,
          mixed_url: "http://unsigned/other-dub.mp4",
          mixed_asset_id: "other-dub"
        }
      ]
    });
    expect(resolveCutShotVersionVideo(shot, shot.versions[1])).toEqual(
      RAW_OTHER_VIDEO
    );
  });
});
