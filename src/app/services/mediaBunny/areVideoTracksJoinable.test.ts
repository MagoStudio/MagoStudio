import { describe, expect, it } from "vitest";

import {
  areVideoTracksJoinable,
  ShotVideoTrackDescriptor
} from "./areVideoTracksJoinable";

const baseTrack: ShotVideoTrackDescriptor = {
  videoCodec: "avc",
  codedWidth: 512,
  codedHeight: 1024,
  hasAudioTrack: true,
  audioCodec: "aac"
};

describe("areVideoTracksJoinable", () => {
  it("is joinable for identical tracks", () => {
    expect(
      areVideoTracksJoinable([baseTrack, { ...baseTrack }, { ...baseTrack }])
    ).toEqual({ isJoinable: true });
  });

  it("is joinable for a single clip", () => {
    expect(areVideoTracksJoinable([baseTrack])).toEqual({ isJoinable: true });
  });

  it("reports a video codec mismatch", () => {
    expect(
      areVideoTracksJoinable([baseTrack, { ...baseTrack, videoCodec: "hevc" }])
    ).toEqual({ isJoinable: false, disagreeingProperty: "videoCodec" });
  });

  it("reports a coded dimension mismatch", () => {
    expect(
      areVideoTracksJoinable([baseTrack, { ...baseTrack, codedWidth: 720 }])
    ).toEqual({ isJoinable: false, disagreeingProperty: "codedWidth" });
    expect(
      areVideoTracksJoinable([baseTrack, { ...baseTrack, codedHeight: 720 }])
    ).toEqual({ isJoinable: false, disagreeingProperty: "codedHeight" });
  });

  it("reports audio present on some shots only", () => {
    expect(
      areVideoTracksJoinable([
        baseTrack,
        { ...baseTrack, hasAudioTrack: false, audioCodec: null }
      ])
    ).toEqual({ isJoinable: false, disagreeingProperty: "hasAudioTrack" });
  });

  it("reports an audio codec mismatch", () => {
    expect(
      areVideoTracksJoinable([baseTrack, { ...baseTrack, audioCodec: "opus" }])
    ).toEqual({ isJoinable: false, disagreeingProperty: "audioCodec" });
  });
});
