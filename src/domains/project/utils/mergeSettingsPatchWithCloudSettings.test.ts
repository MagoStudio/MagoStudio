import { describe, expect, it } from "vitest";

import { mergeSettingsPatchWithCloudSettings } from "./mergeSettingsPatchWithCloudSettings";

const folder = (id: string, parentFolderId = "") => ({
  id,
  name: id,
  parentFolderId,
  type: "folder" as const,
  createdAt: 1
});

const shot = (id: string, parentFolderId = "") => ({
  id,
  name: id,
  parentFolderId,
  type: "shot" as const,
  createdAt: 1
});

const project = (id: string, parentFolderId = "") => ({
  id,
  name: id,
  parentFolderId,
  type: "project" as const,
  createdAt: 1
});

describe("mergeSettingsPatchWithCloudSettings", () => {
  it("returns the patch unchanged when there is no merge base", () => {
    expect(
      mergeSettingsPatchWithCloudSettings({
        freshCloudSettings: { pinnedTrackIds: { shotB: "track2" } },
        settingsPatch: { pinnedTrackIds: { shotA: "track1" }, rangeMin: 2 },
        settingsMergeBase: {}
      })
    ).toEqual({ pinnedTrackIds: { shotA: "track1" }, rangeMin: 2 });
  });

  it("merges pinnedTrackIds against the fresh cloud value", () => {
    expect(
      mergeSettingsPatchWithCloudSettings({
        freshCloudSettings: { pinnedTrackIds: { shotB: "track2" } },
        settingsPatch: { pinnedTrackIds: { shotA: "track1" } },
        settingsMergeBase: { pinnedTrackIds: {} }
      })
    ).toEqual({ pinnedTrackIds: { shotB: "track2", shotA: "track1" } });
  });

  it("merges shotFolders against the fresh cloud value", () => {
    expect(
      mergeSettingsPatchWithCloudSettings({
        freshCloudSettings: { shotFolders: [shot("s1"), shot("cloud")] },
        settingsPatch: { shotFolders: [shot("s1"), folder("local")] },
        settingsMergeBase: { shotFolders: [shot("s1")] }
      })
    ).toEqual({
      shotFolders: [shot("s1"), shot("cloud"), folder("local")]
    });
  });

  it("merges project folders against the fresh cloud value", () => {
    expect(
      mergeSettingsPatchWithCloudSettings({
        freshCloudSettings: { folders: [project("p1"), project("p2")] },
        settingsPatch: { folders: [] },
        settingsMergeBase: { folders: [project("p1")] }
      })
    ).toEqual({ folders: [project("p2")] });
  });

  it("treats a missing or malformed cloud value as empty", () => {
    expect(
      mergeSettingsPatchWithCloudSettings({
        freshCloudSettings: { pinnedTrackIds: "broken" },
        settingsPatch: {
          pinnedTrackIds: { shotA: "track1" },
          shotFolders: [shot("s1")]
        },
        settingsMergeBase: { pinnedTrackIds: {}, shotFolders: [] }
      })
    ).toEqual({
      pinnedTrackIds: { shotA: "track1" },
      shotFolders: [shot("s1")]
    });
  });

  it("ignores a merge base for a key the patch does not carry", () => {
    expect(
      mergeSettingsPatchWithCloudSettings({
        freshCloudSettings: { shotFolders: [shot("s1")] },
        settingsPatch: { rangeMin: 4 },
        settingsMergeBase: { shotFolders: [] }
      })
    ).toEqual({ rangeMin: 4 });
  });
});
