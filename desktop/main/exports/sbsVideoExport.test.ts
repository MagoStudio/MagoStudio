import { describe, expect, it } from "vitest";

import { buildSbsFfmpegArgs } from "./sbsVideoExport";

describe("buildSbsFfmpegArgs", () => {
  it("trims the input range and stacks horizontal videos on a portrait canvas", () => {
    const { args, durationSeconds } = buildSbsFfmpegArgs({
      inputPath: "input.mp4",
      renderPath: "render.mp4",
      outputPath: "comparison.mp4",
      startFrame: 24,
      endFrame: 72,
      fps: 24,
      horizontal: true
    });

    expect(durationSeconds).toBe(2);
    expect(args.slice(args.indexOf("-ss"), args.indexOf("-ss") + 2)).toEqual([
      "-ss",
      "1"
    ]);
    const filter = args[args.indexOf("-filter_complex") + 1];
    expect(filter).toContain("color=c=black:s=1080x1920:r=24:d=2");
    expect(filter).toContain("overlay=12:448");
    expect(filter).toContain("overlay=87:1059");
    expect(filter).toContain("drawtext=text='mago.studio'");
    expect(args).toContain("0:a?");
  });

  it("places portrait videos side by side", () => {
    const { args } = buildSbsFfmpegArgs({
      inputPath: "input.mp4",
      renderPath: "render.mp4",
      outputPath: "comparison.mp4",
      startFrame: 0,
      endFrame: 30,
      fps: 30,
      horizontal: false
    });

    const filter = args[args.indexOf("-filter_complex") + 1];
    expect(filter).toContain("scale=522:959");
    expect(filter).toContain("overlay=12:501");
    expect(filter).toContain("overlay=546:709");
  });
});
