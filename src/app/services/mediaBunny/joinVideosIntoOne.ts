import type {
  BufferTarget,
  Input,
  InputAudioTrack,
  InputVideoTrack,
  Output
} from "mediabunny";

import {
  areVideoTracksJoinable,
  JoinabilityDisagreeingProperty,
  ShotVideoTrackDescriptor
} from "./areVideoTracksJoinable";
import { getJoinedTimestampOffsets } from "./getJoinedTimestampOffsets";
import { getMediabunny } from "./lazyLoad";

const INTERNAL_FILE_OBJECT_NAME = "joined_video.mp4";

export class NotJoinableVideosError extends Error {
  disagreeingProperty: JoinabilityDisagreeingProperty;

  constructor(disagreeingProperty: JoinabilityDisagreeingProperty) {
    super(`Shots cannot be joined: ${disagreeingProperty} disagrees.`);
    this.name = "NotJoinableVideosError";
    this.disagreeingProperty = disagreeingProperty;
  }
}

const getShotVideoTrackDescriptor = async (
  videoTrack: InputVideoTrack,
  audioTrack: InputAudioTrack | null
): Promise<ShotVideoTrackDescriptor> => ({
  videoCodec: await videoTrack.getCodec(),
  codedWidth: await videoTrack.getCodedWidth(),
  codedHeight: await videoTrack.getCodedHeight(),
  hasAudioTrack: !!audioTrack,
  audioCodec: audioTrack ? await audioTrack.getCodec() : null
});

const warnNotJoinableInDevelopment = (
  disagreeingProperty: JoinabilityDisagreeingProperty
): void => {
  if (process.env.NODE_ENV !== "development") return;
  console.warn(
    `joinVideosIntoOne refused: ${disagreeingProperty} disagrees between Shots.`
  );
};

export const joinVideosIntoOne = async (videoBlobs: Blob[]): Promise<File> => {
  const {
    Input: InputClass,
    Output: OutputClass,
    BlobSource,
    Mp4OutputFormat,
    BufferTarget: BufferTargetClass,
    EncodedPacketSink,
    EncodedVideoPacketSource: EncodedVideoPacketSourceClass,
    EncodedAudioPacketSource: EncodedAudioPacketSourceClass,
    ALL_FORMATS
  } = await getMediabunny();

  const inputs: Input[] = [];

  try {
    for (const blob of videoBlobs) {
      inputs.push(
        new InputClass({ source: new BlobSource(blob), formats: ALL_FORMATS })
      );
    }

    const videoTracks = await Promise.all(
      inputs.map((input) => input.getPrimaryVideoTrack())
    );
    const missingVideoTrackIndex = videoTracks.findIndex((track) => !track);
    if (missingVideoTrackIndex !== -1) {
      throw new Error(
        `Shot at index ${missingVideoTrackIndex} has no video track.`
      );
    }
    const resolvedVideoTracks = videoTracks as InputVideoTrack[];

    const audioTracks = await Promise.all(
      inputs.map((input) => input.getPrimaryAudioTrack())
    );

    const trackDescriptors = await Promise.all(
      resolvedVideoTracks.map((videoTrack, index) =>
        getShotVideoTrackDescriptor(videoTrack, audioTracks[index])
      )
    );

    const joinability = areVideoTracksJoinable(trackDescriptors);
    if (!joinability.isJoinable) {
      warnNotJoinableInDevelopment(joinability.disagreeingProperty);
      throw new NotJoinableVideosError(joinability.disagreeingProperty);
    }

    const videoFirstTimestamps = await Promise.all(
      resolvedVideoTracks.map((videoTrack) => videoTrack.getFirstTimestamp())
    );
    const videoTrackEnds = await Promise.all(
      resolvedVideoTracks.map((videoTrack) => videoTrack.computeDuration())
    );
    const audioFirstTimestamps = await Promise.all(
      audioTracks.map(async (audioTrack) =>
        audioTrack ? await audioTrack.getFirstTimestamp() : 0
      )
    );
    const audioTrackEnds = await Promise.all(
      audioTracks.map(async (audioTrack) =>
        audioTrack ? await audioTrack.computeDuration() : 0
      )
    );

    const clipSpans = resolvedVideoTracks.map((_videoTrack, index) => {
      const videoSpan = videoTrackEnds[index] - videoFirstTimestamps[index];
      const audioSpan = audioTracks[index]
        ? audioTrackEnds[index] - audioFirstTimestamps[index]
        : 0;
      return Math.max(videoSpan, audioSpan);
    });
    const cumulativeClipOffsets = getJoinedTimestampOffsets(clipSpans);

    const { videoCodec, hasAudioTrack, audioCodec } = trackDescriptors[0];
    if (!videoCodec) {
      throw new Error("The first Shot's video track has no usable codec.");
    }

    let output: Output | undefined;
    try {
      output = new OutputClass({
        format: new Mp4OutputFormat({ fastStart: "in-memory" }),
        target: new BufferTargetClass()
      });

      const videoSource = new EncodedVideoPacketSourceClass(videoCodec);
      output.addVideoTrack(videoSource);

      const audioSource =
        hasAudioTrack && audioCodec
          ? new EncodedAudioPacketSourceClass(audioCodec)
          : null;
      if (audioSource) {
        output.addAudioTrack(audioSource);
      }

      await output.start();

      let isFirstVideoPacket = true;
      let isFirstAudioPacket = true;

      for (let index = 0; index < inputs.length; index++) {
        const videoTrack = resolvedVideoTracks[index];
        const audioTrack = audioTracks[index];
        const videoTimestampShift =
          cumulativeClipOffsets[index] - videoFirstTimestamps[index];
        const audioTimestampShift =
          cumulativeClipOffsets[index] - audioFirstTimestamps[index];

        const videoSink = new EncodedPacketSink(videoTrack);
        for await (const packet of videoSink.packets()) {
          const shiftedPacket = packet.clone({
            timestamp: packet.timestamp + videoTimestampShift,
            sideData: packet.sideData
          });
          const meta = isFirstVideoPacket
            ? {
                decoderConfig:
                  (await videoTrack.getDecoderConfig()) ?? undefined
              }
            : undefined;
          await videoSource.add(shiftedPacket, meta);
          isFirstVideoPacket = false;
        }

        if (audioSource && audioTrack) {
          const audioSink = new EncodedPacketSink(audioTrack);
          for await (const packet of audioSink.packets()) {
            const shiftedPacket = packet.clone({
              timestamp: packet.timestamp + audioTimestampShift,
              sideData: packet.sideData
            });
            const meta = isFirstAudioPacket
              ? {
                  decoderConfig:
                    (await audioTrack.getDecoderConfig()) ?? undefined
                }
              : undefined;
            await audioSource.add(shiftedPacket, meta);
            isFirstAudioPacket = false;
          }
        }
      }

      await output.finalize();

      const resultBuffer = (output.target as BufferTarget).buffer;
      if (!resultBuffer) {
        throw new Error(
          "The muxer finished without producing an output buffer."
        );
      }

      return new File([resultBuffer], INTERNAL_FILE_OBJECT_NAME, {
        type: "video/mp4"
      });
    } catch (error) {
      if (output) {
        await output.cancel().catch(() => undefined);
      }
      throw error;
    }
  } finally {
    inputs.forEach((input) => input.dispose());
  }
};
