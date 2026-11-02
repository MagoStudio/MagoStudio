import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import ffmpegPath from "ffmpeg-static";
import { expect, it } from "vitest";

import { extractMetricsFrameGrid } from "./localScriptMedia";

it("extracts both a full metrics grid and the final-frame partial grid with bundled FFmpeg", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "mago-metrics-test-"));
  try {
    const filename = path.join(directory, "shot.mp4");
    await promisify(execFile)(
      ffmpegPath!,
      [
        "-hide_banner",
        "-loglevel",
        "error",
        "-f",
        "lavfi",
        "-i",
        "testsrc2=size=64x64:rate=24:duration=5",
        "-c:v",
        "libx264",
        filename
      ],
      { windowsHide: true, timeout: 10000 }
    );
    for (const timestamps of [[0, 1.25, 2.5, 3.75], [5]]) {
      const png = await extractMetricsFrameGrid(filename, timestamps, 5);
      expect(png.subarray(1, 4).toString()).toBe("PNG");
      expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([
        1024, 1024
      ]);
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
