import { EventEmitter } from "node:events";
import {
  mkdtemp,
  readFile,
  rm,
  stat,
  utimes,
  writeFile
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UploadService } from "./uploadService";

const ffmpegInvocations = vi.hoisted(() => [] as string[][]);

vi.mock("ffmpeg-static", () => ({ default: "ffmpeg" }));

vi.mock("node:child_process", async () => {
  const { writeFile: writeEncodedFile } = await import("node:fs/promises");
  return {
    spawn: (_executable: string, args: string[]) => {
      ffmpegInvocations.push(args);
      const child = Object.assign(new EventEmitter(), {
        stderr: new EventEmitter()
      });
      const outputPath = args[args.length - 1]!;
      const trimStartIndex = args.indexOf("-ss");
      const trimDurationIndex = args.indexOf("-t");
      const encodedTrimDescription = JSON.stringify({
        trimStartSeconds:
          trimStartIndex === -1 ? null : args[trimStartIndex + 1],
        trimDurationSeconds:
          trimDurationIndex === -1 ? null : args[trimDurationIndex + 1]
      });
      void writeEncodedFile(outputPath, encodedTrimDescription).then(() =>
        child.emit("exit", 0)
      );
      return child;
    }
  };
});

let libraryRoot = "";
let sourcePath = "";

beforeEach(async () => {
  ffmpegInvocations.length = 0;
  libraryRoot = await mkdtemp(path.join(tmpdir(), "mago-upload-cache-"));
  sourcePath = path.join(libraryRoot, "source.mov");
  await writeFile(sourcePath, "source video");
  const sourceModifiedAt = new Date(Date.now() - 60_000);
  await utimes(sourcePath, sourceModifiedAt, sourceModifiedAt);
});

afterEach(async () => {
  await rm(libraryRoot, { recursive: true, force: true });
});

const makeUploadService = () => new UploadService(async () => libraryRoot);

describe("UploadService.prepare", () => {
  it("encodes a second trim of the same asset instead of reusing the first trim's encode", async () => {
    const uploads = makeUploadService();

    const firstTrim = await uploads.prepare({
      assetId: "shared-asset",
      sourcePath,
      trimStartSeconds: 1,
      trimEndSeconds: 3
    });
    const secondTrim = await uploads.prepare({
      assetId: "shared-asset",
      sourcePath,
      trimStartSeconds: 5,
      trimEndSeconds: 9
    });

    expect(secondTrim.encoded).toBe(true);
    expect(secondTrim.filePath).not.toBe(firstTrim.filePath);
    expect(JSON.parse(await readFile(secondTrim.filePath, "utf8"))).toEqual({
      trimStartSeconds: "5",
      trimDurationSeconds: "4"
    });
    expect(JSON.parse(await readFile(firstTrim.filePath, "utf8"))).toEqual({
      trimStartSeconds: "1",
      trimDurationSeconds: "2"
    });
  });

  it("reuses the encode for the same asset and trim", async () => {
    const uploads = makeUploadService();
    const trim = { trimStartSeconds: 1, trimEndSeconds: 3 };

    const first = await uploads.prepare({
      assetId: "asset",
      sourcePath,
      ...trim
    });
    const second = await uploads.prepare({
      assetId: "asset",
      sourcePath,
      ...trim
    });

    expect(first.encoded).toBe(true);
    expect(second).toEqual({ ...first, encoded: false });
    expect(ffmpegInvocations).toHaveLength(1);
  });

  it("treats trims that round to the same millisecond as one encode", async () => {
    const uploads = makeUploadService();

    await uploads.prepare({
      assetId: "asset",
      sourcePath,
      trimStartSeconds: 1.0001,
      trimEndSeconds: 3.0004
    });
    const roundedTrim = await uploads.prepare({
      assetId: "asset",
      sourcePath,
      trimStartSeconds: 1,
      trimEndSeconds: 3
    });

    expect(roundedTrim.encoded).toBe(false);
    expect(ffmpegInvocations).toHaveLength(1);
    expect(ffmpegInvocations[0]).toEqual(
      expect.arrayContaining(["-ss", "1", "-t", "2"])
    );
  });

  it("keeps the untrimmed encode apart from a trimmed one", async () => {
    const uploads = makeUploadService();

    const untrimmed = await uploads.prepare({ assetId: "asset", sourcePath });
    const trimmed = await uploads.prepare({
      assetId: "asset",
      sourcePath,
      trimStartSeconds: 2
    });

    expect(trimmed.encoded).toBe(true);
    expect(trimmed.relativePath).not.toBe(untrimmed.relativePath);
  });

  it("never reuses an encode cached before the trim was part of the key", async () => {
    const uploads = makeUploadService();
    const legacyCachePath = path.join(
      libraryRoot,
      "cloud",
      "uploads",
      "asset.mp4"
    );
    await uploads.prepare({ assetId: "warm-up", sourcePath });
    await writeFile(legacyCachePath, "encode of an unknown trim");

    const prepared = await uploads.prepare({ assetId: "asset", sourcePath });

    expect(prepared.encoded).toBe(true);
    expect(prepared.filePath).not.toBe(legacyCachePath);
    await expect(stat(legacyCachePath)).rejects.toThrow();
  });

  it("re-encodes when the source changed after the cached encode", async () => {
    const uploads = makeUploadService();
    await uploads.prepare({ assetId: "asset", sourcePath });
    const sourceModifiedLater = new Date(Date.now() + 60_000);
    await utimes(sourcePath, sourceModifiedLater, sourceModifiedLater);

    const prepared = await uploads.prepare({ assetId: "asset", sourcePath });

    expect(prepared.encoded).toBe(true);
  });
});
