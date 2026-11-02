import { createHash } from "node:crypto";
import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  stat,
  writeFile
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { copyModelsToRunningComfy } from "./copyModelsToRunningComfy";

const TEMP_PREFIX = path.join(tmpdir(), "mago-active-comfy-copy-");
let testRoot: string | undefined;
afterEach(async () => {
  vi.unstubAllGlobals();
  if (testRoot && path.isAbsolute(testRoot) && testRoot.startsWith(TEMP_PREFIX))
    await rm(testRoot, { recursive: true, force: true });
  testRoot = undefined;
});

const fixture = async () => {
  testRoot = await mkdtemp(TEMP_PREFIX);
  const activeRoot = path.join(testRoot, "active", "ComfyUI");
  const folder = path.join(testRoot, "shared-loras");
  const sourceFolder = path.join(
    testRoot,
    "selected-install",
    "models",
    "loras"
  );
  await mkdir(activeRoot, { recursive: true });
  await mkdir(sourceFolder, { recursive: true });
  await writeFile(path.join(activeRoot, "main.py"), "# fixture");
  const contents = "verified model contents";
  const item = {
    kind: "model-file" as const,
    name: "test.safetensors",
    bytes: Buffer.byteLength(contents),
    sha256: createHash("sha256").update(contents).digest("hex"),
    downloadUrl: "https://example.test/model",
    absolutePath: path.join(sourceFolder, "test.safetensors")
  };
  await writeFile(item.absolutePath, contents);
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) =>
      Response.json(
        url.endsWith("/system_stats")
          ? { system: { argv: [path.join(activeRoot, "main.py")] } }
          : [{ name: "loras", folders: [folder] }]
      )
    )
  );
  return { item, contents, folder, destination: path.join(folder, item.name) };
};

describe("copying installer models to the running ComfyUI", () => {
  it("keeps the downloaded original and publishes a verified copy to the active model folder", async () => {
    const { item, contents, destination } = await fixture();
    const copy = await copyModelsToRunningComfy("http://127.0.0.1:8188");
    await copy!(item, new AbortController().signal);
    expect(await readFile(destination, "utf8")).toBe(contents);
    expect(await readFile(item.absolutePath, "utf8")).toBe(contents);
    // A retry can reuse the staged model and the identical active copy.
    await copy!(item, new AbortController().signal);
    expect(await readFile(destination, "utf8")).toBe(contents);
  });

  it("preserves an existing different checkpoint and reports where the staged download is saved", async () => {
    const { item, folder, destination } = await fixture();
    await mkdir(folder, { recursive: true });
    await writeFile(destination, "user's existing checkpoint");
    const copy = await copyModelsToRunningComfy("http://localhost:8188");
    await expect(copy!(item, new AbortController().signal)).rejects.toThrow(
      item.absolutePath
    );
    expect(await readFile(destination, "utf8")).toBe(
      "user's existing checkpoint"
    );
  });

  it("does not publish a corrupted staged checkpoint", async () => {
    const { item, destination } = await fixture();
    await writeFile(item.absolutePath, "corrupted");
    const copy = await copyModelsToRunningComfy("http://localhost:8188");
    await expect(copy!(item, new AbortController().signal)).rejects.toThrow(
      "SHA-256"
    );
    expect(await stat(destination).catch(() => null)).toBeNull();
  });

  it("does not treat paths from a remote server as local copy destinations", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    expect(
      await copyModelsToRunningComfy("http://remote-server:8188")
    ).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("leaves downloads staged when the running installation cannot be identified", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({}))
    );
    expect(await copyModelsToRunningComfy("http://localhost:8188")).toBeNull();
  });
});
