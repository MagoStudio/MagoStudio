import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type { BrowserWindow } from "electron";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LOCAL_SCRIPT_MODEL_FILES } from "../scriptProjects/comfyScriptProjectClient";

import { downloadSetupRequirement } from "./downloadSetupRequirement";
const { picker } = vi.hoisted(() => ({ picker: vi.fn() }));
vi.mock("electron", () => ({ dialog: { showOpenDialog: picker } }));
const settings = {
  endpoint: "http://127.0.0.1:8188",
  vlmBackend: "qwen3-vl-2b-gguf",
  scriptTextModel: "qwen38-27b-q5",
  textModelProvider: "cloud"
} as const;
const window = {} as BrowserWindow;
const filename = LOCAL_SCRIPT_MODEL_FILES.videoVae;
let directory: string;
let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), "mago-download-test-"));
  picker.mockResolvedValue({ canceled: false, filePaths: [directory] });
  fetchMock = vi.fn(async (url: string) => {
    if (url.endsWith("/system_stats"))
      return Response.json({
        system: { argv: [path.join(directory, "main.py")] }
      });
    if (url.endsWith("/experiment/models"))
      return Response.json([{ name: "vae", folders: [directory] }]);
    return new Response("model bytes", {
      headers: { "content-type": "application/octet-stream" }
    });
  });
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(async () => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  await rm(directory, { recursive: true, force: true });
});
describe("requirement downloads", () => {
  it("defaults the picker to the discovered folder and writes the model", async () => {
    expect(await downloadSetupRequirement(window, settings, filename)).toEqual({
      outcome: "saved",
      savedTo: path.join(directory, filename)
    });
    expect(picker).toHaveBeenCalledWith(
      window,
      expect.objectContaining({ defaultPath: directory })
    );
    expect(await readFile(path.join(directory, filename), "utf8")).toBe(
      "model bytes"
    );
  });
  it("does not download when the picker is canceled", async () => {
    picker.mockResolvedValue({ canceled: true, filePaths: [] });
    expect(
      await downloadSetupRequirement(window, settings, filename)
    ).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it("preserves an existing file", async () => {
    await writeFile(path.join(directory, filename), "existing");
    await expect(
      downloadSetupRequirement(window, settings, filename)
    ).rejects.toThrow();
    expect(await readFile(path.join(directory, filename), "utf8")).toBe(
      "existing"
    );
  });
  it("retains resumable files after a stream failure", async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (!url.includes("huggingface.co")) return Response.json({});
      return new Response(
        new ReadableStream({
          pull(controller) {
            controller.error(new Error("Transfer interrupted"));
          }
        })
      );
    });
    await expect(
      downloadSetupRequirement(window, settings, filename)
    ).rejects.toThrow("Transfer interrupted");
    expect(await readdir(directory)).toContain(filename + ".mago-part.json");
  });
});

it("refuses a cached node ZIP that does not match the pinned bundle hash", async () => {
  const zip = path.join(directory, "ComfyUI-KJNodes.zip");
  await writeFile(zip, "tampered archive");
  await expect(
    downloadSetupRequirement(window, settings, "MiniMaxChunkFeedForward")
  ).rejects.toThrow("SHA-256");
  const remaining = await readdir(directory);
  expect(
    remaining.some((name) => name.startsWith("ComfyUI-KJNodes.zip.invalid-"))
  ).toBe(true);
  expect(remaining).not.toContain("ComfyUI-KJNodes");
});
