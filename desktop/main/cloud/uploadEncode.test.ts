import { describe, expect, it } from "vitest";

import {
  buildUploadEncodeArgs,
  uploadCachePath,
  uploadCachePathBeforeTrimWasKeyed
} from "./uploadEncode";

const BASE = {
  sourcePath: "C:/videos/source.mov",
  outputPath: "C:/library/cloud/uploads/asset.mp4"
};

const valueAfter = (args: string[], flag: string): string | undefined =>
  args[args.indexOf(flag) + 1];

describe("buildUploadEncodeArgs", () => {
  it("produces the codec shape that makes cloud ingestion a stream copy", () => {
    // Cloud ingestion re-encodes unless the input is h264 + aac + bt709.
    const args = buildUploadEncodeArgs(BASE);

    expect(valueAfter(args, "-c:v")).toBe("libx264");
    expect(valueAfter(args, "-c:a")).toBe("aac");
    expect(valueAfter(args, "-colorspace")).toBe("bt709");
    expect(valueAfter(args, "-color_primaries")).toBe("bt709");
    expect(valueAfter(args, "-color_trc")).toBe("bt709");
    expect(valueAfter(args, "-pix_fmt")).toBe("yuv420p");
    expect(valueAfter(args, "-f")).toBe("mp4");
  });

  it("writes a faststart mp4 so the cloud can read the header first", () => {
    expect(valueAfter(buildUploadEncodeArgs(BASE), "-movflags")).toBe(
      "+faststart"
    );
  });

  it("normalises rotation rather than leaving it to be applied twice", () => {
    expect(valueAfter(buildUploadEncodeArgs(BASE), "-metadata:s:v:0")).toBe(
      "rotate=0"
    );
  });

  it("keeps audio optional so a silent video still encodes", () => {
    expect(buildUploadEncodeArgs(BASE)).toContain("0:a:0?");
  });

  it("reads the source and writes the output that were asked for", () => {
    const args = buildUploadEncodeArgs(BASE);

    expect(valueAfter(args, "-i")).toBe(BASE.sourcePath);
    expect(args[args.length - 1]).toBe(BASE.outputPath);
  });

  it("omits seek and duration entirely when no trim is requested", () => {
    const args = buildUploadEncodeArgs(BASE);

    expect(args).not.toContain("-ss");
    expect(args).not.toContain("-t");
  });

  it("seeks before the input so the trim is cheap", () => {
    const args = buildUploadEncodeArgs({ ...BASE, trimStartSeconds: 2.5 });

    expect(args.indexOf("-ss")).toBeLessThan(args.indexOf("-i"));
    expect(valueAfter(args, "-ss")).toBe("2.5");
  });

  it("converts an end point into a duration relative to the trim start", () => {
    const args = buildUploadEncodeArgs({
      ...BASE,
      trimStartSeconds: 2,
      trimEndSeconds: 6.5
    });

    expect(valueAfter(args, "-t")).toBe("4.5");
  });

  it("treats an end point with no start as a duration from zero", () => {
    expect(
      valueAfter(buildUploadEncodeArgs({ ...BASE, trimEndSeconds: 3 }), "-t")
    ).toBe("3");
  });

  it("does not emit a zero seek", () => {
    expect(
      buildUploadEncodeArgs({ ...BASE, trimStartSeconds: 0 })
    ).not.toContain("-ss");
  });

  it("refuses a negative trim start", () => {
    expect(() =>
      buildUploadEncodeArgs({ ...BASE, trimStartSeconds: -1 })
    ).toThrow(/negative/);
  });

  it("refuses a trim range too short to produce a frame", () => {
    expect(() =>
      buildUploadEncodeArgs({
        ...BASE,
        trimStartSeconds: 5,
        trimEndSeconds: 5
      })
    ).toThrow(/too short/);
    expect(() =>
      buildUploadEncodeArgs({
        ...BASE,
        trimStartSeconds: 5,
        trimEndSeconds: 4
      })
    ).toThrow(/too short/);
  });

  it("overwrites without prompting and never reads stdin", () => {
    // An ffmpeg prompt in the main process would hang the upload silently.
    const args = buildUploadEncodeArgs(BASE);

    expect(args).toContain("-y");
    expect(args).toContain("-nostdin");
  });
});

describe("uploadCachePath", () => {
  it("caches an untrimmed upload per asset inside the library", () => {
    expect(uploadCachePath({ assetId: "abc-123" })).toBe(
      "cloud/uploads/abc-123.encode-v1.trim-full.mp4"
    );
  });

  it("caches each trim of one asset separately", () => {
    expect(
      uploadCachePath({
        assetId: "abc-123",
        trimStartSeconds: 1.5,
        trimEndSeconds: 4
      })
    ).toBe("cloud/uploads/abc-123.encode-v1.trim-1500-4000.mp4");
  });
});

describe("uploadCachePathBeforeTrimWasKeyed", () => {
  it("names the cache file used before the trim was part of the key", () => {
    expect(uploadCachePathBeforeTrimWasKeyed("abc-123")).toBe(
      "cloud/uploads/abc-123.mp4"
    );
  });
});
