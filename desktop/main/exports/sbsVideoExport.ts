import { spawn } from "node:child_process";
import { copyFile, mkdtemp, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import ffmpegPath from "ffmpeg-static";

const OUTPUT_WIDTH = 1080;
const OUTPUT_HEIGHT = 1920;
const MAX_ERROR_LENGTH = 4_000;
const BRAND_Y_OFFSET = 141;
const PILL_Y_OFFSET = 154;
const BRAND_X_OFFSET = 90;
const PILL_TEXT_Y_OFFSET = 28;
const INITIAL_PROGRESS_PERCENTAGE = 5;
const MAX_ENCODING_PROGRESS_PERCENTAGE = 95;
const ENCODING_PROGRESS_RANGE = 90;
const COMPLETE_PROGRESS_PERCENTAGE = 100;
const MICROSECONDS_PER_SECOND = 1_000_000;

type Layout = {
  videoWidth: number;
  videoHeight: number;
  renderX: number;
  renderY: number;
  inputX: number;
  inputY: number;
};

const HORIZONTAL_LAYOUT: Layout = {
  videoWidth: 981,
  videoHeight: 599,
  renderX: 12,
  renderY: 448,
  inputX: 87,
  inputY: 1059
};

const VERTICAL_LAYOUT: Layout = {
  videoWidth: 522,
  videoHeight: 959,
  renderX: 12,
  renderY: 501,
  inputX: 546,
  inputY: 709
};

export interface SbsFfmpegOptions {
  inputPath: string;
  renderPath: string;
  outputPath: string;
  startFrame: number;
  endFrame: number;
  fps: number;
  horizontal: boolean;
}

const finitePositive = (value: number, name: string): number => {
  if (!Number.isFinite(value) || value <= 0)
    throw new Error(`${name} must be a positive finite number`);
  return value;
};

export const buildSbsFfmpegArgs = (
  options: SbsFfmpegOptions
): { args: string[]; durationSeconds: number } => {
  const fps = finitePositive(options.fps, "fps");
  if (!Number.isInteger(options.startFrame) || options.startFrame < 0)
    throw new Error("startFrame must be a non-negative integer");
  if (
    !Number.isInteger(options.endFrame) ||
    options.endFrame < options.startFrame
  )
    throw new Error("endFrame must be at least startFrame");

  const startSeconds = options.startFrame / fps;
  const durationSeconds = Math.max(
    1 / fps,
    (options.endFrame - options.startFrame) / fps
  );
  const layout = options.horizontal ? HORIZONTAL_LAYOUT : VERTICAL_LAYOUT;
  const brandY = layout.renderY - BRAND_Y_OFFSET;
  const pillY = layout.renderY - PILL_Y_OFFSET;
  const fit = (label: string, output: string) =>
    `[${label}]fps=${fps},scale=${layout.videoWidth}:${layout.videoHeight}:force_original_aspect_ratio=increase,crop=${layout.videoWidth}:${layout.videoHeight},setsar=1[${output}]`;
  const filter = [
    fit("0:v", "inputv"),
    fit("1:v", "renderv"),
    `color=c=black:s=${OUTPUT_WIDTH}x${OUTPUT_HEIGHT}:r=${fps}:d=${durationSeconds}[bg]`,
    `[bg][renderv]overlay=${layout.renderX}:${layout.renderY}:shortest=1[withrender]`,
    `[withrender][inputv]overlay=${layout.inputX}:${layout.inputY}:shortest=1[composed]`,
    `[composed]drawtext=text='mago':fontcolor=white:fontsize=58:x=${layout.renderX + BRAND_X_OFFSET}:y=${brandY},drawbox=x=700:y=${pillY}:w=290:h=106:color=0x242428:t=fill,drawtext=text='mago.studio':fontcolor=white:fontsize=40:x=740:y=${pillY + PILL_TEXT_Y_OFFSET}[outv]`
  ].join(";");

  return {
    durationSeconds,
    args: [
      "-hide_banner",
      "-loglevel",
      "error",
      "-ss",
      String(startSeconds),
      "-t",
      String(durationSeconds),
      "-i",
      options.inputPath,
      "-t",
      String(durationSeconds),
      "-i",
      options.renderPath,
      "-filter_complex",
      filter,
      "-map",
      "[outv]",
      "-map",
      "0:a?",
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-b:v",
      "5M",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-movflags",
      "+faststart",
      "-progress",
      "pipe:1",
      "-nostats",
      "-y",
      options.outputPath
    ]
  };
};

export const exportSbsVideo = async (
  options: Omit<SbsFfmpegOptions, "outputPath"> & { destinationPath: string },
  onProgress?: (percentage: number) => void
): Promise<void> => {
  if (!ffmpegPath) throw new Error("The bundled FFmpeg is unavailable");
  const [inputStats, renderStats] = await Promise.all([
    stat(options.inputPath),
    stat(options.renderPath)
  ]);
  if (!inputStats.isFile() || !renderStats.isFile())
    throw new Error("The comparison videos are unavailable on disk");

  const temporaryDirectory = await mkdtemp(
    path.join(os.tmpdir(), "mago-sbs-export-")
  );
  const temporaryOutput = path.join(temporaryDirectory, "comparison.mp4");
  const { args, durationSeconds } = buildSbsFfmpegArgs({
    ...options,
    outputPath: temporaryOutput
  });
  const executable = ffmpegPath.replace("app.asar", "app.asar.unpacked");

  try {
    onProgress?.(INITIAL_PROGRESS_PERCENTAGE);
    await new Promise<void>((resolve, reject) => {
      const child = spawn(executable, args, {
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"]
      });
      let progressBuffer = "";
      let errorOutput = "";
      child.stdout.on("data", (chunk: Buffer) => {
        progressBuffer += chunk.toString();
        const lines = progressBuffer.split(/\r?\n/);
        progressBuffer = lines.pop() ?? "";
        for (const line of lines) {
          const match = /^out_time_(?:us|ms)=(\d+)$/.exec(line);
          if (!match) continue;
          const elapsedSeconds = Number(match[1]) / MICROSECONDS_PER_SECOND;
          const percentage = Math.min(
            MAX_ENCODING_PROGRESS_PERCENTAGE,
            Math.max(
              INITIAL_PROGRESS_PERCENTAGE,
              Math.round(
                (elapsedSeconds / durationSeconds) * ENCODING_PROGRESS_RANGE
              )
            )
          );
          onProgress?.(percentage);
        }
      });
      child.stderr.on("data", (chunk: Buffer) => {
        errorOutput = `${errorOutput}${chunk.toString()}`.slice(
          -MAX_ERROR_LENGTH
        );
      });
      child.once("error", reject);
      child.once("exit", (code) => {
        if (code === 0) resolve();
        else
          reject(
            new Error(
              `Unable to create side-by-side video${
                errorOutput.trim() ? `: ${errorOutput.trim()}` : ""
              }`
            )
          );
      });
    });
    await copyFile(temporaryOutput, options.destinationPath);
    onProgress?.(COMPLETE_PROGRESS_PERCENTAGE);
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
};
