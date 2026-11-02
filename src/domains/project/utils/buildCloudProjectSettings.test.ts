import { describe, expect, it } from "vitest";

import { buildCloudProjectSettings } from "./buildCloudProjectSettings";

describe("buildCloudProjectSettings", () => {
  it("applies the patch on top of the fresh cloud settings", () => {
    expect(
      buildCloudProjectSettings(
        { shot_engine: "web", output_size: [1920, 1080], type: "timeline" },
        { shot_engine: "local" }
      )
    ).toEqual({
      shot_engine: "local",
      output_size: [1920, 1080],
      type: "timeline"
    });
  });

  it("keeps cloud keys the patch does not mention", () => {
    expect(
      buildCloudProjectSettings(
        { agent_chat: [], web_only_key: "kept" },
        { pinnedTrackIds: { shot: "track" } }
      )
    ).toEqual({
      agent_chat: [],
      web_only_key: "kept",
      pinnedTrackIds: { shot: "track" }
    });
  });

  it("drops local-only keys from both the cloud settings and the patch", () => {
    expect(
      buildCloudProjectSettings(
        { origin: "cloud", cloudSummary: {}, folders: [] },
        { origin: "cloud", cloudSummary: { total_renders: 2 }, rangeMin: 4 }
      )
    ).toEqual({ folders: [], rangeMin: 4 });
  });

  it("merges keys that carry a merge base against the fresh cloud value", () => {
    expect(
      buildCloudProjectSettings(
        { pinnedTrackIds: { cloudShot: "cloudTrack" }, rangeMin: 1 },
        { pinnedTrackIds: { localShot: "localTrack" } },
        { pinnedTrackIds: {} }
      )
    ).toEqual({
      pinnedTrackIds: { cloudShot: "cloudTrack", localShot: "localTrack" },
      rangeMin: 1
    });
  });

  it("starts from an empty document when the cloud has no settings", () => {
    expect(buildCloudProjectSettings(undefined, {})).toEqual({});
  });
});
