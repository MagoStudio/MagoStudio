import { execFile } from "node:child_process";
import { mkdtemp, readFile, rmdir, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import ffmpegPath from "ffmpeg-static";
import { afterEach, expect, it } from "vitest";

import { validateVideo } from "./validateVideo";

const run = promisify(execFile);
const fixtures: Array<{ directory: string; filename: string }> = [];

afterEach(async () => {
  for (const { directory, filename } of fixtures.splice(0)) {
    await unlink(filename);
    await rmdir(directory);
  }
});

const createVideo = async (): Promise<string> => {
  if (!ffmpegPath) throw new Error("The bundled FFmpeg is unavailable");
  const directory = await mkdtemp(
    path.join(tmpdir(), "mago-video-validation-")
  );
  const filename = path.join(directory, "output.mp4");
  fixtures.push({ directory, filename });
  await run(ffmpegPath, [
    "-v",
    "error",
    "-f",
    "lavfi",
    "-i",
    "color=c=blue:s=64x64:d=1",
    "-c:v",
    "libx264",
    "-movflags",
    "+faststart",
    "-y",
    filename
  ]);
  return filename;
};

it("accepts a video whose frames can be decoded", async () => {
  await expect(validateVideo(await createVideo())).resolves.toBeUndefined();
});

it("rejects damaged encoded frames even when the MP4 container is intact", async () => {
  const filename = await createVideo();
  const bytes = await readFile(filename);
  let damaged = false;
  for (let offset = 0; offset + 8 <= bytes.length;) {
    const size = bytes.readUInt32BE(offset);
    if (size < 8 || offset + size > bytes.length)
      throw new Error("Unexpected fixture MP4 box");
    if (bytes.toString("ascii", offset + 4, offset + 8) === "mdat") {
      bytes.fill(0, offset + 8, offset + size);
      damaged = true;
      break;
    }
    offset += size;
  }
  expect(damaged).toBe(true);
  await writeFile(filename, bytes);

  // Reproduce the old false positive: stream copying succeeds on these bytes.
  await run(ffmpegPath!, [
    "-hide_banner",
    "-loglevel",
    "error",
    "-xerror",
    "-i",
    filename,
    "-map",
    "0:v:0",
    "-c",
    "copy",
    "-f",
    "null",
    "-"
  ]);
  await expect(validateVideo(filename)).rejects.toThrow(
    "incomplete or unreadable"
  );
});
