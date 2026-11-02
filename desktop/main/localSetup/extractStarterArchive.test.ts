import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { strToU8, zipSync } from "fflate";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { extractStarterArchive } from "./extractStarterArchive";

describe.skipIf(process.platform !== "win32")("starter ZIP extraction", () => {
  let directory: string;
  beforeEach(async () => {
    directory = await mkdtemp(path.join(os.tmpdir(), "mago-starter-"));
  });
  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it("extracts Git checkpoint paths beyond the Windows MAX_PATH limit", async () => {
    const name =
      "ComfyUI_windows_portable/ComfyUI/custom_nodes/ComfyUI-MagoNodes/" +
      ".git/refs/codex/turn-diffs/checkpoints/07ec26d1465e143f88f0c4a620c293dc/" +
      "df42a609792706b1f01695f77b3bdbda/1790718743755/a46444a7-37d1-4ed7-b496-8e6494bc8d04";
    const archive = path.join(directory, "comfy.zip");
    const staging = path.join(directory, "extract");
    await writeFile(archive, zipSync({ [name]: strToU8("checkpoint") }));
    expect(path.join(staging, name).length).toBeGreaterThan(260);
    await extractStarterArchive(archive, staging, new AbortController().signal);
    expect(await readFile(path.join(staging, name), "utf8")).toBe("checkpoint");
  });

  it("rejects traversal before extracting any entries and reports a readable error", async () => {
    const archive = path.join(directory, "comfy.zip");
    const staging = path.join(directory, "extract");
    await writeFile(
      archive,
      zipSync({
        "safe.txt": strToU8("safe"),
        "../escaped.txt": strToU8("unsafe")
      })
    );
    await expect(
      extractStarterArchive(archive, staging, new AbortController().signal)
    ).rejects.toThrow(
      "Could not extract the ComfyUI bundle. Unsafe archive path"
    );
    expect(await readdir(directory)).toEqual(["comfy.zip"]);
  });
});
