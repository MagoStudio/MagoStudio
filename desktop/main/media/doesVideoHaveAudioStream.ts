import { spawn } from "node:child_process";

import ffmpegPath from "ffmpeg-static";

const PROBE_TIMEOUT_MS = 30_000;
const AUDIO_STREAM_LINE = /Stream #\d+:\d+[^\n]*: Audio:/;
const OPENED_INPUT_LINE = /^Input #0, /;

export const doesFfmpegInputReportAudioStream = (
  ffmpegOutput: string
): boolean => AUDIO_STREAM_LINE.test(ffmpegOutput);

export const createAudioStreamLineScanner = () => {
  let unfinishedLine = "";
  let hasFoundAudioStream = false;
  let hasFfmpegOpenedInput = false;
  let lastCompleteLine = "";
  return {
    read(outputChunk: string): void {
      const lines = (unfinishedLine + outputChunk).split("\n");
      unfinishedLine = lines.pop() ?? "";
      lastCompleteLine =
        lines.filter((line) => line.trim().length > 0).at(-1) ??
        lastCompleteLine;
      hasFfmpegOpenedInput ||= lines.some((line) =>
        OPENED_INPUT_LINE.test(line)
      );
      hasFoundAudioStream ||= lines.some(doesFfmpegInputReportAudioStream);
    },
    hasAudioStream(): boolean {
      return (
        hasFoundAudioStream || doesFfmpegInputReportAudioStream(unfinishedLine)
      );
    },
    hasOpenedInput(): boolean {
      return hasFfmpegOpenedInput || OPENED_INPUT_LINE.test(unfinishedLine);
    },
    lastReportedLine(): string {
      return unfinishedLine.trim() || lastCompleteLine.trim();
    }
  };
};

export const doesVideoHaveAudioStream = (filename: string): Promise<boolean> =>
  new Promise((resolve, reject) => {
    if (!ffmpegPath) {
      reject(new Error("The bundled video encoder is unavailable"));
      return;
    }
    const child = spawn(
      ffmpegPath.replace("app.asar", "app.asar.unpacked"),
      ["-hide_banner", "-i", filename],
      { windowsHide: true, stdio: ["ignore", "ignore", "pipe"] }
    );
    const audioStreamScanner = createAudioStreamLineScanner();
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error("Timed out checking the video's audio"));
    }, PROBE_TIMEOUT_MS);
    child.stderr.on("data", (chunk: Buffer) => {
      audioStreamScanner.read(chunk.toString());
    });
    child.once("error", (failure) => {
      clearTimeout(timer);
      reject(failure);
    });
    child.once("close", () => {
      clearTimeout(timer);
      if (!audioStreamScanner.hasOpenedInput()) {
        reject(
          new Error(
            `Could not read the source video to check its audio: ${audioStreamScanner.lastReportedLine()}`
          )
        );
        return;
      }
      resolve(audioStreamScanner.hasAudioStream());
    });
  });
