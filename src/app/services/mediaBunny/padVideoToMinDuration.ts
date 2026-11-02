import type { BufferTarget } from "mediabunny";

import { getPaddingFramePlan } from "./getPaddingFramePlan";
import { getMediabunny } from "./lazyLoad";
import { EncodingProgress } from "./types";

const FALLBACK_FPS = 30;
const PACKET_STATS_SAMPLE_COUNT = 100;
const OUTPUT_BITRATE = 5_000_000;
const PROGRESS_UPDATE_EVERY_FRAMES = 10;
const ENCODE_PROGRESS_START = 20;
const ENCODE_PROGRESS_RANGE = 70;

const BLACK = "#000000";

export async function padVideoToMinDuration(
  file: File,
  minSeconds: number,
  onProgress?: (progress: EncodingProgress) => void
): Promise<File> {
  const {
    Input,
    Output,
    BlobSource,
    Mp4OutputFormat,
    BufferTarget,
    CanvasSource,
    VideoSampleSink,
    AudioSampleSink,
    AudioBufferSource,
    ALL_FORMATS
  } = await getMediabunny();

  onProgress?.({ percentage: 0, stage: "loading" });

  const input = new Input({
    source: new BlobSource(file),
    formats: ALL_FORMATS
  });
  const videoTrack = await input.getPrimaryVideoTrack();
  if (!videoTrack) {
    throw new Error("No video track found in the input file.");
  }

  const duration = await input.computeDuration();
  if (duration >= minSeconds) {
    return file;
  }

  onProgress?.({ percentage: 10, stage: "processing" });

  const packetStats = await videoTrack.computePacketStats(
    PACKET_STATS_SAMPLE_COUNT
  );
  const fps =
    packetStats.averagePacketRate > 0
      ? packetStats.averagePacketRate
      : FALLBACK_FPS;
  const frameDuration = 1 / fps;
  const { totalFrames, sourceFrameCount } = getPaddingFramePlan(
    duration,
    fps,
    minSeconds
  );

  const width = videoTrack.displayWidth;
  const height = videoTrack.displayHeight;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not create a 2D canvas context for padding.");
  }

  const output = new Output({
    format: new Mp4OutputFormat({ fastStart: "in-memory" }),
    target: new BufferTarget()
  });

  const canvasSource = new CanvasSource(canvas, {
    codec: "avc",
    bitrate: OUTPUT_BITRATE
  });
  output.addVideoTrack(canvasSource);

  const audioTrack = await input.getPrimaryAudioTrack();
  const audioSink = audioTrack ? new AudioSampleSink(audioTrack) : null;
  const audioSource = audioTrack
    ? new AudioBufferSource({ codec: "aac", bitrate: 128_000 })
    : null;
  if (audioSource) {
    output.addAudioTrack(audioSource);
  }

  await output.start();

  if (audioSink && audioSource) {
    for await (const sample of audioSink.samples(0, duration)) {
      await audioSource.add(sample.toAudioBuffer());
      sample.close?.();
    }
  }

  const videoSink = new VideoSampleSink(videoTrack);
  ctx.fillStyle = BLACK;
  onProgress?.({ percentage: ENCODE_PROGRESS_START, stage: "encoding" });

  for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
    const timestamp = frameIndex / fps;
    const isWithinSource = frameIndex < sourceFrameCount;
    const sample = isWithinSource ? await videoSink.getSample(timestamp) : null;
    const videoFrame = sample ? sample.toVideoFrame() : null;

    if (videoFrame) {
      ctx.drawImage(videoFrame, 0, 0, width, height);
      videoFrame.close();
    } else {
      ctx.fillRect(0, 0, width, height);
    }
    sample?.close?.();

    await canvasSource.add(timestamp, frameDuration);

    if (frameIndex % PROGRESS_UPDATE_EVERY_FRAMES === 0) {
      onProgress?.({
        percentage: Math.round(
          ENCODE_PROGRESS_START +
            (frameIndex / totalFrames) * ENCODE_PROGRESS_RANGE
        ),
        stage: "encoding"
      });
    }
  }

  onProgress?.({ percentage: 95, stage: "finalizing" });
  await output.finalize();

  const resultBuffer = (output.target as BufferTarget).buffer;
  if (!resultBuffer) {
    throw new Error("Failed to generate padded output buffer.");
  }

  onProgress?.({ percentage: 100, stage: "finalizing" });

  return new File(
    [resultBuffer],
    file.name.replace(/\.[^/.]+$/, "_padded.mp4"),
    { type: "video/mp4" }
  );
}
