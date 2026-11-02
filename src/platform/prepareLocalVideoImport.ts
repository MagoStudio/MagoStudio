import { extractFrameFromVideo } from "@app/services/mediaBunny/frameExtraction";
import { getMediabunny } from "@app/services/mediaBunny/lazyLoad";
import { captureVideoFrame } from "@app/utils/video/captureVideoFrame";

import type { LocalVideoImport } from "../../desktop/shared/contracts";

const DEFAULT_FPS = 30;
const PACKET_SAMPLE_COUNT = 100;

export const prepareLocalVideoImport = async (
  file: File
): Promise<LocalVideoImport> => {
  const sourcePath = window.mago.files.getPath(file);
  if (!sourcePath) throw new Error(`Cannot resolve the path for ${file.name}`);

  const { Input, BlobSource, ALL_FORMATS } = await getMediabunny();
  const input = new Input({
    source: new BlobSource(file),
    formats: ALL_FORMATS
  });
  const track = await input.getPrimaryVideoTrack();
  if (!track) throw new Error(`${file.name} does not contain a video track`);
  if (!(await track.canDecode())) {
    throw new Error(
      `${file.name} uses a video codec this computer cannot decode`
    );
  }

  const durationSeconds = await input.computeDuration();
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new Error(`${file.name} has an invalid duration`);
  }
  const packetStats = await track.computePacketStats(PACKET_SAMPLE_COUNT);
  const fps = packetStats.averagePacketRate || DEFAULT_FPS;

  let thumbnailDataUrl: string;
  try {
    thumbnailDataUrl = await extractFrameFromVideo({
      videoSource: file,
      frameNumber: 0,
      fps
    });
  } catch {
    const objectUrl = URL.createObjectURL(file);
    try {
      thumbnailDataUrl = await captureVideoFrame({
        videoUrl: objectUrl,
        frame: 0,
        fps
      });
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  return {
    sourcePath,
    name: file.name,
    durationSeconds,
    fps,
    width: track.displayWidth,
    height: track.displayHeight,
    frameCount: Math.max(1, Math.round(durationSeconds * fps)),
    thumbnailDataUrl
  };
};
