import { describe, expect, it } from "vitest";

import {
  createAudioStreamLineScanner,
  doesFfmpegInputReportAudioStream
} from "./doesVideoHaveAudioStream";

describe("doesFfmpegInputReportAudioStream", () => {
  it("finds an audio stream in ffmpeg's input report", () => {
    expect(
      doesFfmpegInputReportAudioStream(
        [
          "Input #0, mov,mp4,m4a,3gp,3g2,mj2, from 'input.mp4':",
          "  Stream #0:0[0x1](und): Video: h264 (High), yuv420p, 1280x720, 24 fps",
          "  Stream #0:1[0x2](und): Audio: aac (LC), 48000 Hz, stereo, fltp"
        ].join("\n")
      )
    ).toBe(true);
  });

  it("reports a silent clip", () => {
    expect(
      doesFfmpegInputReportAudioStream(
        [
          "Input #0, mov,mp4,m4a,3gp,3g2,mj2, from 'input.mp4':",
          "  Stream #0:0[0x1](und): Video: h264 (High), yuv420p, 1280x720, 24 fps",
          "At least one output file must be specified"
        ].join("\n")
      )
    ).toBe(false);
  });
});

describe("createAudioStreamLineScanner", () => {
  it("finds an audio stream after long metadata, with the line split across chunks", () => {
    const scanner = createAudioStreamLineScanner();
    scanner.read(`    comment         : ${"x".repeat(50_000)}\n`);
    scanner.read("  Stream #0:1[0x2](und): Aud");
    scanner.read("io: aac (LC), 48000 Hz, stereo\n");

    expect(scanner.hasAudioStream()).toBe(true);
  });

  it("reports a silent clip", () => {
    const scanner = createAudioStreamLineScanner();
    scanner.read("  Stream #0:0[0x1](und): Video: h264, 1280x720\n");

    expect(scanner.hasAudioStream()).toBe(false);
  });

  it("finds an audio stream on a last line without a line break", () => {
    const scanner = createAudioStreamLineScanner();
    scanner.read("  Stream #0:1: Audio: aac");

    expect(scanner.hasAudioStream()).toBe(true);
  });

  it("knows ffmpeg opened the video once it reports the input", () => {
    const scanner = createAudioStreamLineScanner();
    scanner.read("Input #0, mov,mp4,m4a,3gp,3g2,mj2, from 'input.mp4':\n");
    scanner.read("  Stream #0:0[0x1](und): Video: h264, 1280x720\n");
    scanner.read("At least one output file must be specified\n");

    expect(scanner.hasOpenedInput()).toBe(true);
    expect(scanner.hasAudioStream()).toBe(false);
  });

  it("reports why ffmpeg could not open the video", () => {
    const scanner = createAudioStreamLineScanner();
    scanner.read("input.mp4: Invalid data found when processing input\n");

    expect(scanner.hasOpenedInput()).toBe(false);
    expect(scanner.lastReportedLine()).toBe(
      "input.mp4: Invalid data found when processing input"
    );
  });
});
