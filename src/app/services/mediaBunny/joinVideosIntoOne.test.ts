import { beforeEach, describe, expect, it, vi } from "vitest";

import { joinVideosIntoOne, NotJoinableVideosError } from "./joinVideosIntoOne";

const videoSourceAddMock = vi.hoisted(() => vi.fn());
const outputStartMock = vi.hoisted(() => vi.fn());
const outputFinalizeMock = vi.hoisted(() => vi.fn());
const outputCancelMock = vi.hoisted(() => vi.fn());
const inputDisposeMock = vi.hoisted(() => vi.fn());
const addVideoTrackMock = vi.hoisted(() => vi.fn());
const audioSourceAddMock = vi.hoisted(() => vi.fn());

class FakePacket {
  constructor(
    public timestamp: number,
    public sideData: Record<string, unknown> = {}
  ) {}

  clone({
    timestamp,
    sideData
  }: {
    timestamp: number;
    sideData?: Record<string, unknown>;
  }) {
    return new FakePacket(timestamp, sideData ?? this.sideData);
  }
}

interface FakeShotSource {
  videoPacketTimestamps: number[];
  videoFirstTimestamp: number;
  videoTrackEnd: number;
  audioPacketTimestamps: number[] | null;
  audioFirstTimestamp: number;
  audioTrackEnd: number;
  videoCodec: string;
  codedWidth: number;
  codedHeight: number;
}

vi.mock("mediabunny", () => ({
  ALL_FORMATS: [],
  BlobSource: class {
    constructor(public shot: FakeShotSource) {}
  },
  Input: class {
    constructor(public options: { source: { shot: FakeShotSource } }) {}
    async getPrimaryVideoTrack() {
      const { shot } = this.options.source;
      return {
        getCodec: () => shot.videoCodec,
        getCodedWidth: () => shot.codedWidth,
        getCodedHeight: () => shot.codedHeight,
        getDecoderConfig: () => ({ codec: shot.videoCodec }),
        getFirstTimestamp: () => shot.videoFirstTimestamp,
        computeDuration: () => shot.videoTrackEnd,
        packetTimestamps: shot.videoPacketTimestamps
      };
    }
    async getPrimaryAudioTrack() {
      const { shot } = this.options.source;
      if (!shot.audioPacketTimestamps) return null;
      return {
        getCodec: () => "aac",
        getDecoderConfig: () => ({ codec: "aac" }),
        getFirstTimestamp: () => shot.audioFirstTimestamp,
        computeDuration: () => shot.audioTrackEnd,
        packetTimestamps: shot.audioPacketTimestamps
      };
    }
    dispose() {
      inputDisposeMock();
    }
  },
  Output: class {
    target = { buffer: new ArrayBuffer(8) };
    addVideoTrack = addVideoTrackMock;
    addAudioTrack() {}
    start = outputStartMock;
    finalize = outputFinalizeMock;
    cancel = outputCancelMock;
  },
  Mp4OutputFormat: class {},
  BufferTarget: class {},
  EncodedPacketSink: class {
    constructor(private track: { packetTimestamps: number[] }) {}
    async *packets() {
      for (const timestamp of this.track.packetTimestamps) {
        yield new FakePacket(timestamp, { skipSamples: timestamp < 0 });
      }
    }
  },
  EncodedVideoPacketSource: class {
    constructor(public codec: string) {}
    add = videoSourceAddMock;
  },
  EncodedAudioPacketSource: class {
    add = audioSourceAddMock;
  }
}));

const shot = (overrides: Partial<FakeShotSource>): FakeShotSource => ({
  videoPacketTimestamps: [0, 1],
  videoFirstTimestamp: 0,
  videoTrackEnd: 2,
  audioPacketTimestamps: null,
  audioFirstTimestamp: 0,
  audioTrackEnd: 2,
  videoCodec: "avc",
  codedWidth: 512,
  codedHeight: 1024,
  ...overrides
});

const asBlob = (source: FakeShotSource) => source as unknown as Blob;

describe("joinVideosIntoOne", () => {
  beforeEach(() => {
    videoSourceAddMock.mockReset().mockResolvedValue(undefined);
    outputStartMock.mockReset().mockResolvedValue(undefined);
    outputFinalizeMock.mockReset().mockResolvedValue(undefined);
    outputCancelMock.mockReset().mockResolvedValue(undefined);
    inputDisposeMock.mockReset();
    addVideoTrackMock.mockReset();
    audioSourceAddMock.mockReset().mockResolvedValue(undefined);
  });

  it("re-stamps each packet by the running offset of the preceding clips", async () => {
    const firstShot = shot({
      videoPacketTimestamps: [0, 1],
      videoTrackEnd: 2,
      audioTrackEnd: 2
    });
    const secondShot = shot({
      videoPacketTimestamps: [0, 1.5],
      videoTrackEnd: 3,
      audioTrackEnd: 3
    });

    await joinVideosIntoOne([asBlob(firstShot), asBlob(secondShot)]);

    const addedTimestamps = videoSourceAddMock.mock.calls.map(
      ([packet]) => (packet as FakePacket).timestamp
    );
    expect(addedTimestamps).toEqual([0, 1, 2, 3.5]);
  });

  it("passes decoder-config meta on the first packet of the track only", async () => {
    const firstShot = shot({
      videoPacketTimestamps: [0, 1],
      videoTrackEnd: 2,
      audioTrackEnd: 2
    });
    const secondShot = shot({
      videoPacketTimestamps: [0, 1.5],
      videoTrackEnd: 3,
      audioTrackEnd: 3
    });

    await joinVideosIntoOne([asBlob(firstShot), asBlob(secondShot)]);

    const metasByCall = videoSourceAddMock.mock.calls.map(([, meta]) => meta);
    expect(metasByCall[0]).toEqual({ decoderConfig: { codec: "avc" } });
    expect(metasByCall[1]).toBeUndefined();
    expect(metasByCall[2]).toBeUndefined();
    expect(metasByCall[3]).toBeUndefined();
  });

  it("shifts the video and audio tracks of one clip independently, each landing on the cumulative offset by its own first timestamp", async () => {
    const primedShot = shot({
      videoPacketTimestamps: [0, 1],
      videoFirstTimestamp: 0,
      videoTrackEnd: 2,
      audioPacketTimestamps: [-0.032, 0.968],
      audioFirstTimestamp: -0.032,
      audioTrackEnd: 0.968
    });
    const secondShot = shot({
      videoPacketTimestamps: [0, 1],
      videoFirstTimestamp: 0,
      videoTrackEnd: 3,
      audioPacketTimestamps: [0, 1],
      audioFirstTimestamp: 0,
      audioTrackEnd: 1
    });

    await joinVideosIntoOne([asBlob(primedShot), asBlob(secondShot)]);

    const addedVideoTimestamps = videoSourceAddMock.mock.calls.map(
      ([packet]) => (packet as FakePacket).timestamp
    );
    const addedAudioTimestamps = audioSourceAddMock.mock.calls.map(
      ([packet]) => (packet as FakePacket).timestamp
    );
    expect(addedVideoTimestamps).toEqual([0, 1, 2, 3]);
    expect(addedAudioTimestamps[0]).toBeCloseTo(0, 10);
    expect(addedAudioTimestamps[1]).toBeCloseTo(1, 10);
    expect(addedAudioTimestamps[2]).toBeCloseTo(2, 10);
    expect(addedAudioTimestamps[3]).toBeCloseTo(3, 10);
  });

  it("positions the next clip using whichever track's true content span is longer, so an audio tail extending past the nominal video length is never overlapped", async () => {
    const shotWithLongerAudioTail = shot({
      videoPacketTimestamps: [0, 1],
      videoTrackEnd: 2,
      audioPacketTimestamps: [-0.032, 0.968, 1.968],
      audioFirstTimestamp: -0.032,
      audioTrackEnd: 2.05
    });
    const secondShot = shot({
      videoPacketTimestamps: [0, 1],
      videoTrackEnd: 1,
      audioPacketTimestamps: [0, 1],
      audioTrackEnd: 1
    });

    await joinVideosIntoOne([
      asBlob(shotWithLongerAudioTail),
      asBlob(secondShot)
    ]);

    const addedVideoTimestamps = videoSourceAddMock.mock.calls.map(
      ([packet]) => (packet as FakePacket).timestamp
    );
    expect(addedVideoTimestamps[2]).toBeCloseTo(2.082, 10);
    expect(addedVideoTimestamps[3]).toBeCloseTo(3.082, 10);
  });

  it("preserves each packet's side data through the clone", async () => {
    const firstShot = shot({
      videoPacketTimestamps: [-1, 0],
      videoFirstTimestamp: -1,
      videoTrackEnd: 2,
      audioTrackEnd: 2
    });

    await joinVideosIntoOne([asBlob(firstShot)]);

    const sideDataByCall = videoSourceAddMock.mock.calls.map(
      ([packet]) => (packet as FakePacket).sideData
    );
    expect(sideDataByCall[0]).toEqual({ skipSamples: true });
    expect(sideDataByCall[1]).toEqual({ skipSamples: false });
  });

  it("throws NotJoinableVideosError carrying the disagreeing property only from the compatibility pre-check", async () => {
    const firstShot = shot({ videoCodec: "avc" });
    const secondShot = shot({ videoCodec: "hevc" });

    const rejection = await joinVideosIntoOne([
      asBlob(firstShot),
      asBlob(secondShot)
    ]).catch((error: unknown) => error);

    expect(rejection).toBeInstanceOf(NotJoinableVideosError);
    expect((rejection as NotJoinableVideosError).disagreeingProperty).toBe(
      "videoCodec"
    );
  });

  it("propagates a muxer rejection as a plain error, never as NotJoinableVideosError", async () => {
    const muxerError = new Error(
      "Timestamps must be non-negative (got -0.032s)."
    );
    outputFinalizeMock.mockRejectedValue(muxerError);
    const onlyShot = shot({});

    const rejection = await joinVideosIntoOne([asBlob(onlyShot)]).catch(
      (error: unknown) => error
    );

    expect(rejection).toBe(muxerError);
    expect(rejection).not.toBeInstanceOf(NotJoinableVideosError);
    expect(outputCancelMock).toHaveBeenCalledTimes(1);
  });

  it("propagates a container-rejected codec (addVideoTrack throwing) as a plain error too", async () => {
    const containerError = new Error(
      "Codec 'pcm-u8' cannot be contained within MP4."
    );
    addVideoTrackMock.mockImplementation(() => {
      throw containerError;
    });
    const onlyShot = shot({});

    const rejection = await joinVideosIntoOne([asBlob(onlyShot)]).catch(
      (error: unknown) => error
    );

    expect(rejection).toBe(containerError);
    expect(rejection).not.toBeInstanceOf(NotJoinableVideosError);
    expect(outputCancelMock).toHaveBeenCalledTimes(1);
  });

  it("disposes every input once the join settles", async () => {
    const firstShot = shot({});
    const secondShot = shot({});

    await joinVideosIntoOne([asBlob(firstShot), asBlob(secondShot)]);

    expect(inputDisposeMock).toHaveBeenCalledTimes(2);
  });
});
