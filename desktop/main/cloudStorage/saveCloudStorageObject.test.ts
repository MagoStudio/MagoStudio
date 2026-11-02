import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { saveCloudStorageObject } from "./saveCloudStorageObject";

const ALLOWED_HOSTS = ["mago-s3-prod.s3.amazonaws.com"];
const OBJECT_URL = "https://mago-s3-prod.s3.amazonaws.com/a/images.zip?sig=1";

const directories: string[] = [];

const temporaryDirectory = async (): Promise<string> => {
  const directory = await mkdtemp(path.join(tmpdir(), "mago-cloud-storage-"));
  directories.push(directory);
  return directory;
};

afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

describe("saveCloudStorageObject", () => {
  it("writes the object to the chosen file", async () => {
    const directory = await temporaryDirectory();
    const destinationPath = path.join(directory, "frames.zip");

    await saveCloudStorageObject({
      url: OBJECT_URL,
      allowedHosts: ALLOWED_HOSTS,
      destinationPath,
      fetchFromCloudStorage: vi
        .fn()
        .mockResolvedValue(new Response("zip-bytes", { status: 200 }))
    });

    expect(await readFile(destinationPath, "utf8")).toBe("zip-bytes");
    expect(await readdir(directory)).toEqual(["frames.zip"]);
  });

  it("writes nothing when the bucket refuses the download", async () => {
    const directory = await temporaryDirectory();

    await expect(
      saveCloudStorageObject({
        url: OBJECT_URL,
        allowedHosts: ALLOWED_HOSTS,
        destinationPath: path.join(directory, "frames.zip"),
        fetchFromCloudStorage: vi
          .fn()
          .mockResolvedValue(new Response("expired", { status: 403 }))
      })
    ).rejects.toThrow("(403)");
    expect(await readdir(directory)).toEqual([]);
  });

  it("refuses a host outside the allowlist before touching the disk", async () => {
    const directory = await temporaryDirectory();
    const fetchFromCloudStorage = vi.fn();

    await expect(
      saveCloudStorageObject({
        url: "https://evil.example/a.zip",
        allowedHosts: ALLOWED_HOSTS,
        destinationPath: path.join(directory, "a.zip"),
        fetchFromCloudStorage
      })
    ).rejects.toThrow("not Mago cloud storage");
    expect(fetchFromCloudStorage).not.toHaveBeenCalled();
    expect(await readdir(directory)).toEqual([]);
  });
});
