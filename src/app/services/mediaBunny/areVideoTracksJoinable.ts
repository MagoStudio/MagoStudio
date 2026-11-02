import type { AudioCodec, VideoCodec } from "mediabunny";

export interface ShotVideoTrackDescriptor {
  videoCodec: VideoCodec | null;
  codedWidth: number;
  codedHeight: number;
  hasAudioTrack: boolean;
  audioCodec: AudioCodec | null;
}

export type JoinabilityDisagreeingProperty =
  | "videoCodec"
  | "codedWidth"
  | "codedHeight"
  | "hasAudioTrack"
  | "audioCodec";

export type VideoTrackJoinability =
  | { isJoinable: true }
  | {
      isJoinable: false;
      disagreeingProperty: JoinabilityDisagreeingProperty;
    };

const disagreeingProperty = (
  reference: ShotVideoTrackDescriptor,
  candidate: ShotVideoTrackDescriptor
): JoinabilityDisagreeingProperty | undefined => {
  if (candidate.videoCodec !== reference.videoCodec) return "videoCodec";
  if (candidate.codedWidth !== reference.codedWidth) return "codedWidth";
  if (candidate.codedHeight !== reference.codedHeight) return "codedHeight";
  if (candidate.hasAudioTrack !== reference.hasAudioTrack)
    return "hasAudioTrack";
  if (candidate.audioCodec !== reference.audioCodec) return "audioCodec";
  return undefined;
};

export const areVideoTracksJoinable = (
  tracks: ShotVideoTrackDescriptor[]
): VideoTrackJoinability => {
  const [reference, ...rest] = tracks;
  if (!reference) return { isJoinable: true };

  for (const candidate of rest) {
    const disagreement = disagreeingProperty(reference, candidate);
    if (disagreement) {
      return { isJoinable: false, disagreeingProperty: disagreement };
    }
  }

  return { isJoinable: true };
};
