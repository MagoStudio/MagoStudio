import { spawnSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import ffmpegPath from "ffmpeg-static";
import { afterEach, describe, expect, it } from "vitest";

import { probeRenderedVideoMetadata } from "./probeRenderedVideoMetadata";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

describe("probeRenderedVideoMetadata", () => {
  it("counts the frames of a real video with the bundled ffmpeg", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "mago-render-probe-"));
    temporaryDirectories.push(directory);
    const videoPath = path.join(directory, "output.mp4");
    spawnSync(ffmpegPath!, [
      "-hide_banner",
      "-loglevel",
      "error",
      "-f",
      "lavfi",
      "-i",
      "testsrc=size=64x48:rate=24",
      "-frames:v",
      "39",
      "-pix_fmt",
      "yuv420p",
      videoPath
    ]);

    await expect(probeRenderedVideoMetadata(videoPath)).resolves.toEqual({
      frameCount: 39,
      fps: 24,
      width: 64,
      height: 48
    });
  });

  it("knows nothing about a file that is not there", async () => {
    await expect(
      probeRenderedVideoMetadata(path.join(tmpdir(), "missing-render.mp4"))
    ).resolves.toBeNull();
  });
});
