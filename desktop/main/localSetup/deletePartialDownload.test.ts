import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { deletePartialDownload } from "./deletePartialDownload";

describe("deletePartialDownload", () => {
  let folder = "";
  afterEach(async () => {
    await rm(folder, { recursive: true, force: true });
  });

  it("deletes the partial file and its resume metadata but keeps other files", async () => {
    folder = await mkdtemp(path.join(os.tmpdir(), "partial-download-"));
    const destination = path.join(folder, "model.gguf");
    await writeFile(destination + ".mago-part", "partial bytes");
    await writeFile(destination + ".mago-part.json", "{}");
    await writeFile(path.join(folder, "other.gguf"), "other model");
    await deletePartialDownload(destination);
    expect(await readdir(folder)).toEqual(["other.gguf"]);
  });

  it("does nothing when no partial file exists", async () => {
    folder = await mkdtemp(path.join(os.tmpdir(), "partial-download-"));
    await expect(
      deletePartialDownload(path.join(folder, "model.gguf"))
    ).resolves.toBeUndefined();
  });
});
