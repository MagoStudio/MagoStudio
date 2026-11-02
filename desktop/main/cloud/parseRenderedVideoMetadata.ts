import { parseFfmpegVideoStreamDimensions } from "./probeImageDimensions";

const VIDEO_STREAM_LINE = /Stream #\d+:\d+.*?: Video: (.*)$/m;
const STREAM_FRAMES_PER_SECOND = /(?:^|[\s,])(\d+(?:\.\d+)?) fps(?=[\s,]|$)/;

export interface RenderedVideoMetadata {
  frameCount: number;
  fps: number | null;
  width: number | null;
  height: number | null;
}

const readStreamFramesPerSecond = (ffmpegLog: string): number | null => {
  const videoStreamDescription = VIDEO_STREAM_LINE.exec(ffmpegLog)?.[1];
  if (!videoStreamDescription) return null;
  const framesPerSecond = Number(
    STREAM_FRAMES_PER_SECOND.exec(videoStreamDescription)?.[1]
  );
  return framesPerSecond > 0 ? framesPerSecond : null;
};

export const parseRenderedVideoMetadata = ({
  videoPacketCount,
  ffmpegLog
}: {
  videoPacketCount: number;
  ffmpegLog: string;
}): RenderedVideoMetadata | null => {
  if (videoPacketCount <= 0) return null;
  const dimensions = parseFfmpegVideoStreamDimensions(ffmpegLog);
  return {
    frameCount: videoPacketCount,
    fps: readStreamFramesPerSecond(ffmpegLog),
    width: dimensions?.width ?? null,
    height: dimensions?.height ?? null
  };
};
