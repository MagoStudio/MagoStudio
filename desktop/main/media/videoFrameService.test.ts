import { describe, expect, it } from "vitest";

import {
  buildVideoFilmstripArgs,
  buildVideoFrameArgs,
  filmstripFrameIndices
} from "./videoFrameService";

describe("videoFrameService ffmpeg arguments", () => {
  it("seeks to the requested frame and writes one JPEG to stdout", () => {
    const args = buildVideoFrameArgs("render.mp4", 48, 24);

    expect(args.slice(args.indexOf("-ss"), args.indexOf("-ss") + 2)).toEqual([
      "-ss",
      "2"
    ]);
    expect(args).toContain("mjpeg");
    expect(args.at(-1)).toBe("pipe:1");
  });

  it("samples the first and last frames without duplicates", () => {
    expect(filmstripFrameIndices(60, 4)).toEqual([0, 20, 39, 59]);
    expect(filmstripFrameIndices(2, 20)).toEqual([0, 1]);
  });

  it("builds a single tiled JPEG matching the requested preview density", () => {
    const args = buildVideoFilmstripArgs({
      inputPath: "render.mp4",
      width: 520,
      frameHeight: 65,
      sourceWidth: 1920,
      sourceHeight: 1080,
      totalFrames: 60
    });
    const filter = args[args.indexOf("-vf") + 1];

    expect(filter).toContain("select=eq(n\\,0)");
    expect(filter).toContain("eq(n\\,59)");
    expect(filter).toContain("scale=-2:65");
    expect(filter).toContain("tile=4x1:nb_frames=4");
    expect(args.at(-1)).toBe("pipe:1");
  });

  it("uses a safe preview density when persisted cloud dimensions are missing", () => {
    const args = buildVideoFilmstripArgs({
      inputPath: "cloud-render.mp4",
      width: 520,
      frameHeight: 65,
      sourceWidth: 0,
      sourceHeight: 0,
      totalFrames: 60
    });

    expect(args[args.indexOf("-vf") + 1]).toContain("tile=4x1:nb_frames=4");
  });
});
