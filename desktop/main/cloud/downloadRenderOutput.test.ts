import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import type { FetchCloudStorage } from "../cloudStorage/fetchCloudStorageObject";

import { downloadRenderOutput, renderOutputPath } from "./downloadRenderOutput";

const ALLOWED_HOSTS = ["mago-s3-prod.s3.eu-north-1.amazonaws.com"];
const OUTPUT_URL =
  "https://mago-s3-prod.s3.eu-north-1.amazonaws.com/renders/output.mp4?X-Amz-Signature=1";

const directories: string[] = [];

afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

const temporaryLibrary = async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "mago-download-"));
  directories.push(directory);
  return directory;
};

const respondingWith = (
  body: string,
  init: ResponseInit = {}
): FetchCloudStorage =>
  vi.fn(async () => new Response(body, { status: 200, ...init }));

const cloudStorageServing = (fetchFromCloudStorage: FetchCloudStorage) => ({
  allowedHosts: ALLOWED_HOSTS,
  fetchFromCloudStorage
});

describe("renderOutputPath", () => {
  it("keeps each render's output under its own job directory", () => {
    expect(renderOutputPath("job-1")).toBe("renders/cloud/job-1/output.mp4");
  });
});

describe("downloadRenderOutput", () => {
  it("writes the output into the library and reports its size", async () => {
    const body = "rendered-video-bytes";
    const libraryRoot = await temporaryLibrary();

    const result = await downloadRenderOutput({
      url: OUTPUT_URL,
      libraryRoot,
      jobId: "job-1",
      cloudStorage: cloudStorageServing(
        respondingWith(body, {
          headers: { "content-length": String(body.length) }
        })
      )
    });

    expect(result.relativePath).toBe("renders/cloud/job-1/output.mp4");
    expect(result.sizeBytes).toBe(body.length);
    const written = await readFile(
      path.join(libraryRoot, result.relativePath),
      "utf8"
    );
    expect(written).toBe(body);
  });

  it("refuses an output URL outside Mago cloud storage without contacting it", async () => {
    const libraryRoot = await temporaryLibrary();
    const fetchFromCloudStorage = respondingWith("attacker-bytes");

    for (const url of [
      "https://evil.example/output.mp4",
      "http://mago-s3-prod.s3.eu-north-1.amazonaws.com/output.mp4",
      "https://169.254.169.254/latest/meta-data",
      "nonsense"
    ]) {
      await expect(
        downloadRenderOutput({
          url,
          libraryRoot,
          jobId: "job-1",
          cloudStorage: cloudStorageServing(fetchFromCloudStorage)
        })
      ).rejects.toThrow();
    }

    expect(fetchFromCloudStorage).not.toHaveBeenCalled();
    await expect(
      readFile(path.join(libraryRoot, renderOutputPath("job-1")))
    ).rejects.toThrow();
  });

  it("refuses a redirect that leaves Mago cloud storage", async () => {
    const libraryRoot = await temporaryLibrary();
    const fetchFromCloudStorage = vi.fn(
      async () =>
        new Response(null, {
          status: 307,
          headers: { location: "https://evil.example/output.mp4" }
        })
    );

    await expect(
      downloadRenderOutput({
        url: OUTPUT_URL,
        libraryRoot,
        jobId: "job-1",
        cloudStorage: cloudStorageServing(fetchFromCloudStorage)
      })
    ).rejects.toThrow("not Mago cloud storage");
    expect(fetchFromCloudStorage).toHaveBeenCalledTimes(1);
  });

  it("shares one download when the same finished job is reported twice", async () => {
    const body = "rendered-video-bytes";
    const fetchFromCloudStorage = respondingWith(body, {
      headers: { "content-length": String(body.length) }
    });
    const libraryRoot = await temporaryLibrary();
    const input = {
      url: OUTPUT_URL,
      libraryRoot,
      jobId: "job-1",
      cloudStorage: cloudStorageServing(fetchFromCloudStorage)
    };

    const [first, second] = await Promise.all([
      downloadRenderOutput(input),
      downloadRenderOutput(input)
    ]);

    expect(first).toEqual(second);
    expect(fetchFromCloudStorage).toHaveBeenCalledTimes(1);
    await expect(
      readFile(path.join(libraryRoot, first.relativePath), "utf8")
    ).resolves.toBe(body);
  });

  it("reports progress up to one", async () => {
    const body = "x".repeat(4096);
    const libraryRoot = await temporaryLibrary();
    const fractions: number[] = [];

    await downloadRenderOutput({
      url: OUTPUT_URL,
      libraryRoot,
      jobId: "job-1",
      onProgress: (fraction) => fractions.push(fraction),
      cloudStorage: cloudStorageServing(
        respondingWith(body, {
          headers: { "content-length": String(body.length) }
        })
      )
    });

    expect(fractions.at(-1)).toBe(1);
  });

  it("leaves no file behind when the bucket rejects the request", async () => {
    const libraryRoot = await temporaryLibrary();

    await expect(
      downloadRenderOutput({
        url: OUTPUT_URL,
        libraryRoot,
        jobId: "job-1",
        cloudStorage: cloudStorageServing(
          respondingWith("denied", { status: 403 })
        )
      })
    ).rejects.toThrow("(403)");

    await expect(
      readFile(path.join(libraryRoot, renderOutputPath("job-1")))
    ).rejects.toThrow();
  });

  it("refuses a download shorter than its declared length and keeps nothing", async () => {
    const libraryRoot = await temporaryLibrary();

    await expect(
      downloadRenderOutput({
        url: OUTPUT_URL,
        libraryRoot,
        jobId: "job-2",
        cloudStorage: cloudStorageServing(
          respondingWith("short", { headers: { "content-length": "105" } })
        )
      })
    ).rejects.toThrow(/incomplete/);

    await expect(
      readFile(path.join(libraryRoot, renderOutputPath("job-2")))
    ).rejects.toThrow();
    await expect(
      readFile(path.join(libraryRoot, `${renderOutputPath("job-2")}.partial`))
    ).rejects.toThrow();
  });

  it("refuses an empty download", async () => {
    const libraryRoot = await temporaryLibrary();

    await expect(
      downloadRenderOutput({
        url: OUTPUT_URL,
        libraryRoot,
        jobId: "job-1",
        cloudStorage: cloudStorageServing(respondingWith(""))
      })
    ).rejects.toThrow(/empty/);
  });

  it("replaces a stale partial file from an earlier attempt", async () => {
    const body = "fresh-bytes";
    const libraryRoot = await temporaryLibrary();
    const partial = path.join(
      libraryRoot,
      `${renderOutputPath("job-1")}.partial`
    );
    await mkdir(path.dirname(partial), { recursive: true });
    await writeFile(partial, "leftover-garbage");

    const result = await downloadRenderOutput({
      url: OUTPUT_URL,
      libraryRoot,
      jobId: "job-1",
      cloudStorage: cloudStorageServing(
        respondingWith(body, {
          headers: { "content-length": String(body.length) }
        })
      )
    });

    const written = await readFile(
      path.join(libraryRoot, result.relativePath),
      "utf8"
    );
    expect(written).toBe(body);
  });
});
