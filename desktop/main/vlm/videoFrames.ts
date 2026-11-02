import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { nativeImage } from "electron";
import ffmpegPath from "ffmpeg-static";

/**
 * Frame extraction for video captioning — a port of cloud
 * ingestion's frame sampling.
 *
 * The captioner sees a full-resolution first frame (character / environment
 * detail) plus one or more frame-grid montages (motion and consistency over
 * time). Keeping the same geometry as ingestion means the same
 * caption template produces comparable output.
 *
 * The one deliberate difference is GRID_LIMIT: ingestion allows four grids
 * against Gemini, we allow two. Qwen3-VL-2B runs in a 16k context, and each
 * image costs up to ~1.5k tokens on top of a ~1.7k-token template.
 */

const GRID_ROWS = 5;
const GRID_COLS = 5;
/** Minimum frame distance between grid samples, as in ingestion. */
const GRID_STEP = 20;
/** Ingestion allows 4; see the note above. */
const GRID_LIMIT = 2;
const GRID_FRAME_MAX_RES = 256;
const FIRST_FRAME_MAX_RES = 1024;
/** How many leading frames to try before accepting a dark opening shot. */
const FIRST_FRAME_CANDIDATES = 5;
/** Mean luma below this counts as a black frame (ingestion threshold). */
const BLACK_FRAME_THRESHOLD = 10;
const FFMPEG_TIMEOUT_MS = 120_000;
/** How much of ffmpeg's stderr to keep for an error message. */
const STDERR_TAIL_CHARS = 2_000;
/** nativeImage.toBitmap() is BGRA. */
const BGRA_CHANNELS = 4;
/** Rec.601 luma weights, matching PIL's "L" conversion used by ingestion. */
const LUMA_BLUE = 0.114;
const LUMA_GREEN = 0.587;
const LUMA_RED = 0.299;

type VideoCaptionFrames = {
  firstFrame: Buffer;
  grids: Buffer[];
};

/**
 * Evenly spread grid sample indices across the clip.
 *
 * Mirrors ingestion: derive how many full grids the clip can fill
 * given a minimum frame spacing, then spread that many samples over the whole
 * duration and pin the last one to the final frame.
 */
export const selectGridFrameIndices = (totalFrames: number): number[] => {
  if (totalFrames <= 1) return [0];
  const perGrid = GRID_ROWS * GRID_COLS;
  const framesWithStep = Math.floor(totalFrames / GRID_STEP);
  const gridCount = Math.max(
    1,
    Math.min(Math.floor(framesWithStep / perGrid), GRID_LIMIT)
  );
  const wanted = Math.min(perGrid * gridCount, totalFrames);
  const last = totalFrames - 1;
  const indices =
    wanted === 1
      ? [0]
      : Array.from({ length: wanted }, (_, index) =>
          Math.trunc((index * last) / (wanted - 1))
        );
  indices[indices.length - 1] = last;
  // linspace + trunc can repeat indices on short clips; ffmpeg's select filter
  // would emit each matching frame once anyway, so dedupe to keep the count
  // honest for the tile filter.
  return [...new Set(indices)].sort((a, b) => a - b);
};

/** Long-edge fit that keeps both dimensions even (yuv-safe). */
const scaleFilter = (maxRes: number): string =>
  `scale='if(gt(iw,ih),${maxRes},-2)':'if(gt(iw,ih),-2,${maxRes})'`;

const isBlackFrame = (png: Buffer): boolean => {
  const image = nativeImage.createFromBuffer(png);
  if (image.isEmpty()) return true;
  const { width, height } = image.getSize();
  const bitmap = image.toBitmap();
  if (!bitmap.length || !width || !height) return true;
  let total = 0;
  const pixels = Math.floor(bitmap.length / BGRA_CHANNELS);
  for (let index = 0; index < pixels; index += 1) {
    const offset = index * BGRA_CHANNELS;
    total +=
      LUMA_BLUE * bitmap[offset]! +
      LUMA_GREEN * bitmap[offset + 1]! +
      LUMA_RED * bitmap[offset + 2]!;
  }
  return total / pixels < BLACK_FRAME_THRESHOLD;
};

const executable = (): string => {
  if (!ffmpegPath) throw new Error("ffmpeg is unavailable");
  return ffmpegPath.replace("app.asar", "app.asar.unpacked");
};

const runFfmpeg = (args: string[]): Promise<void> =>
  new Promise((resolve, reject) => {
    const child = spawn(executable(), args, { windowsHide: true });
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("ffmpeg timed out extracting frames"));
    }, FFMPEG_TIMEOUT_MS);
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr = (stderr + chunk.toString()).slice(-STDERR_TAIL_CHARS);
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with ${code}: ${stderr}`));
    });
  });

const readOutputs = async (directory: string): Promise<Buffer[]> => {
  const names = (await readdir(directory))
    .filter((name) => name.endsWith(".png"))
    .sort();
  return Promise.all(names.map((name) => readFile(path.join(directory, name))));
};

/**
 * Extract the caption inputs for a video: the first non-black leading frame at
 * up to 1024px, plus up to two 5x5 frame-grid montages at 256px per cell.
 */
export const extractVideoCaptionFrames = async ({
  sourcePath,
  totalFrames
}: {
  sourcePath: string;
  totalFrames: number;
}): Promise<VideoCaptionFrames> => {
  const workDir = await mkdtemp(path.join(tmpdir(), "mago-vlm-"));
  try {
    const firstDir = path.join(workDir, "first");
    const gridDir = path.join(workDir, "grid");
    // ffmpeg writes numbered outputs but will not create the directory.
    await mkdir(firstDir, { recursive: true });
    await mkdir(gridDir, { recursive: true });

    await runFfmpeg([
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      sourcePath,
      "-vf",
      `select='lt(n\\,${FIRST_FRAME_CANDIDATES})',${scaleFilter(FIRST_FRAME_MAX_RES)}`,
      "-vsync",
      "0",
      "-frames:v",
      String(FIRST_FRAME_CANDIDATES),
      path.join(firstDir, "f_%03d.png")
    ]);

    const candidates = await readOutputs(firstDir);
    if (!candidates.length)
      throw new Error("ffmpeg produced no frames for this video");
    // If every leading frame is dark the clip probably opens dark on purpose —
    // keep the first rather than failing (same call ingestion makes).
    const firstFrame =
      candidates.find((frame) => !isBlackFrame(frame)) ?? candidates[0]!;

    const indices = selectGridFrameIndices(totalFrames);
    await runFfmpeg([
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      sourcePath,
      "-vf",
      [
        `select='${indices.map((index) => `eq(n\\,${index})`).join("+")}'`,
        scaleFilter(GRID_FRAME_MAX_RES),
        `tile=${GRID_COLS}x${GRID_ROWS}`
      ].join(","),
      "-vsync",
      "0",
      path.join(gridDir, "g_%03d.png")
    ]);

    const grids = (await readOutputs(gridDir)).slice(0, GRID_LIMIT);
    return { firstFrame, grids };
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
};
