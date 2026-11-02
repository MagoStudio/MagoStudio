import { spawnSync } from "node:child_process";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import ffmpegPath from "ffmpeg-static";
import { afterEach, describe, expect, it } from "vitest";

import {
  buildPngConversionArgs,
  isCloudAcceptedImageExtension,
  prepareCloudImageFile
} from "./cloudImageFile";
import { probeImageDimensions } from "./probeImageDimensions";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

const makeLibrary = async () => {
  const libraryRoot = await mkdtemp(path.join(tmpdir(), "mago-cloud-image-"));
  temporaryDirectories.push(libraryRoot);
  return libraryRoot;
};

describe("isCloudAcceptedImageExtension", () => {
  it("accepts only what cloud Mago registers", () => {
    expect(isCloudAcceptedImageExtension("jpg")).toBe(true);
    expect(isCloudAcceptedImageExtension("JPEG")).toBe(true);
    expect(isCloudAcceptedImageExtension("png")).toBe(true);
    expect(isCloudAcceptedImageExtension("webp")).toBe(false);
  });
});

describe("buildPngConversionArgs", () => {
  it("writes a single png frame and overwrites a stale one", () => {
    const args = buildPngConversionArgs("in.webp", "out.png");
    expect(args).toContain("-y");
    expect(args[args.indexOf("-c:v") + 1]).toBe("png");
    expect(args[args.indexOf("-frames:v") + 1]).toBe("1");
    expect(args.at(-1)).toBe("out.png");
  });
});

describe("prepareCloudImageFile", () => {
  it("uploads a jpg or png exactly as it is", async () => {
    const libraryRoot = await makeLibrary();

    await expect(
      prepareCloudImageFile({
        assetId: "asset-1",
        sourcePath: "C:/images/reference.JPG",
        extension: "JPG",
        libraryRoot
      })
    ).resolves.toEqual({
      filePath: "C:/images/reference.JPG",
      extension: "jpg",
      contentType: "image/jpeg"
    });
  });

  it("converts a webp to png inside the library and reuses the conversion", async () => {
    const libraryRoot = await makeLibrary();
    const sourcePath = path.join(libraryRoot, "reference.webp");
    spawnSync(ffmpegPath!, [
      "-hide_banner",
      "-loglevel",
      "error",
      "-f",
      "lavfi",
      "-i",
      "color=c=blue:s=32x24",
      "-frames:v",
      "1",
      sourcePath
    ]);

    const prepared = await prepareCloudImageFile({
      assetId: "asset-webp",
      sourcePath,
      extension: "webp",
      libraryRoot
    });

    expect(prepared).toEqual({
      filePath: path.join(libraryRoot, "cloud", "images", "asset-webp.png"),
      extension: "png",
      contentType: "image/png"
    });
    await expect(probeImageDimensions(prepared.filePath)).resolves.toEqual({
      width: 32,
      height: 24
    });
    const firstConversion = await stat(prepared.filePath);

    await prepareCloudImageFile({
      assetId: "asset-webp",
      sourcePath,
      extension: "webp",
      libraryRoot
    });
    expect((await stat(prepared.filePath)).mtimeMs).toBe(
      firstConversion.mtimeMs
    );
  });
});
