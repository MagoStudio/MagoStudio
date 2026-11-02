import type { ConversionOptions, BufferTarget } from "mediabunny";

import {
  PROGRESS_UPDATE_INTERVAL,
  PROGRESS_INCREMENT,
  MAX_ENCODING_PROGRESS
} from "./constants";
import { getMediabunny } from "./lazyLoad";
import { TrimOptions, EncodingProgress, EncodingResult } from "./types";

export async function trimAndEncodeVideo(
  inputFile: File,
  trimOptions: TrimOptions,
  onProgress?: (progress: EncodingProgress) => void
): Promise<EncodingResult> {
  try {
    onProgress?.({
      percentage: 0,
      stage: "loading"
    });

    const {
      Input,
      Output,
      Conversion,
      BlobSource,
      Mp4OutputFormat,
      BufferTarget,
      ALL_FORMATS
    } = await getMediabunny();

    const input = new Input({
      source: new BlobSource(inputFile),
      formats: ALL_FORMATS
    });

    onProgress?.({
      percentage: 10,
      stage: "processing"
    });

    const videoTrack = await input.getPrimaryVideoTrack();
    const audioTrack = await input.getPrimaryAudioTrack();

    if (!videoTrack) {
      throw new Error(
        "No video track found in the input file. The file may be corrupted or not a valid video format."
      );
    }

    const output = new Output({
      format: new Mp4OutputFormat({
        fastStart: "in-memory"
      }),
      target: new BufferTarget()
    });

    onProgress?.({
      percentage: 20,
      stage: "encoding"
    });

    const duration = await input.computeDuration();
    const isFullVideo =
      trimOptions.startTime === 0 && trimOptions.endTime >= duration;

    const conversionOptions: ConversionOptions = {
      input,
      output,
      ...(isFullVideo
        ? {}
        : { trim: { start: trimOptions.startTime, end: trimOptions.endTime } }),
      video: {
        codec: "avc",
        width: videoTrack.displayWidth,
        height: videoTrack.displayHeight,
        fit: "fill"
      },
      audio: audioTrack
        ? {
            codec: "aac"
          }
        : undefined
    };

    const conversion = await Conversion.init(conversionOptions);

    let progressInterval: NodeJS.Timeout | null = null;
    let currentProgress = 20;

    progressInterval = setInterval(() => {
      if (currentProgress < MAX_ENCODING_PROGRESS) {
        currentProgress += PROGRESS_INCREMENT;
        onProgress?.({
          percentage: currentProgress,
          stage: "encoding"
        });
      }
    }, PROGRESS_UPDATE_INTERVAL);

    await conversion.execute();

    if (progressInterval) {
      clearInterval(progressInterval);
    }

    onProgress?.({
      percentage: 95,
      stage: "finalizing"
    });

    const resultBuffer = (output.target as BufferTarget).buffer;

    if (!resultBuffer) {
      throw new Error("Failed to generate output buffer");
    }

    const outputFile = new File(
      [resultBuffer],
      inputFile.name.replace(/\.[^/.]+$/, "_trimmed.mp4"),
      { type: "video/mp4" }
    );

    onProgress?.({
      percentage: 100,
      stage: "finalizing"
    });

    return {
      success: true,
      file: outputFile
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process video"
    };
  }
}
