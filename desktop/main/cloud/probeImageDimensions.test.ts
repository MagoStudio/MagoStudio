import { spawnSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import ffmpegPath from "ffmpeg-static";
import { afterEach, describe, expect, it } from "vitest";

import {
  parseFfmpegVideoStreamDimensions,
  probeImageDimensions
} from "./probeImageDimensions";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

describe("parseFfmpegVideoStreamDimensions", () => {
  it("reads the size out of an image stream line", () => {
    expect(
      parseFfmpegVideoStreamDimensions(
        "  Stream #0:0: Video: webp, yuv420p(tv, bt470bg/unknown/unknown), 64x48, 25 fps, 25 tbr"
      )
    ).toEqual({ width: 64, height: 48 });
  });

  it("is not fooled by a codec tag written in hex", () => {
    expect(
      parseFfmpegVideoStreamDimensions(
        "  Stream #0:0[0x1](und): Video: h264 (High) (avc1 / 0x31637661), yuv420p(progressive), 1920x1080 [SAR 1:1 DAR 16:9], 24 fps"
      )
    ).toEqual({ width: 1920, height: 1080 });
  });

  it("returns null when there is no video stream to read", () => {
    expect(
      parseFfmpegVideoStreamDimensions("not-an-image: Invalid data found")
    ).toBeNull();
  });
});

describe("probeImageDimensions", () => {
  it("measures a real image with the bundled ffmpeg", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "mago-probe-"));
    temporaryDirectories.push(directory);
    const imagePath = path.join(directory, "reference.webp");
    spawnSync(ffmpegPath!, [
      "-hide_banner",
      "-loglevel",
      "error",
      "-f",
      "lavfi",
      "-i",
      "color=c=red:s=64x48",
      "-frames:v",
      "1",
      imagePath
    ]);

    await expect(probeImageDimensions(imagePath)).resolves.toEqual({
      width: 64,
      height: 48
    });
  });

  it("returns null for a file that is not there", async () => {
    await expect(
      probeImageDimensions(path.join(tmpdir(), "mago-missing-image.png"))
    ).resolves.toBeNull();
  });
});
