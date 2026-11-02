import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type { BrowserWindow } from "electron";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LOCAL_SCRIPT_MODEL_FILES } from "../scriptProjects/comfyScriptProjectClient";

import { downloadSetupRequirements } from "./downloadSetupRequirements";

const { picker } = vi.hoisted(() => ({ picker: vi.fn() }));
vi.mock("electron", () => ({ dialog: { showOpenDialog: picker } }));

const settings = {
  endpoint: "http://127.0.0.1:8188",
  vlmBackend: "qwen3-vl-2b-gguf",
  scriptTextModel: "qwen38-27b-q5",
  textModelProvider: "cloud"
} as const;
const window = {} as BrowserWindow;
let directory: string;

beforeEach(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), "mago-batch-download-"));
  picker.mockResolvedValue({ canceled: false, filePaths: [directory] });
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (url.endsWith("/system_stats") || url.endsWith("/experiment/models"))
        return Response.json([]);
      return new Response("model bytes", {
        headers: { "content-type": "application/octet-stream" }
      });
    })
  );
});

afterEach(async () => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  await rm(directory, { recursive: true, force: true });
});

describe("downloadSetupRequirements", () => {
  it("asks for the folder once and downloads every file into it", async () => {
    const names = [
      LOCAL_SCRIPT_MODEL_FILES.videoVae,
      LOCAL_SCRIPT_MODEL_FILES.audioVae
    ];

    expect(await downloadSetupRequirements(window, settings, names)).toBe(
      directory
    );
    expect(picker).toHaveBeenCalledTimes(1);
    const systemStatsRequests = vi
      .mocked(fetch)
      .mock.calls.filter(
        ([url]) => typeof url === "string" && url.endsWith("/system_stats")
      );
    expect(systemStatsRequests).toHaveLength(1);
    for (const name of names)
      expect(await readFile(path.join(directory, name), "utf8")).toBe(
        "model bytes"
      );
  });

  it("skips files already finished in the folder, so a retry picks up where it stopped", async () => {
    const finishedName = LOCAL_SCRIPT_MODEL_FILES.videoVae;
    const remainingName = LOCAL_SCRIPT_MODEL_FILES.audioVae;
    await writeFile(path.join(directory, finishedName), "finished earlier");

    expect(
      await downloadSetupRequirements(window, settings, [
        finishedName,
        remainingName
      ])
    ).toBe(directory);
    expect(picker).toHaveBeenCalledTimes(1);
    expect(await readFile(path.join(directory, finishedName), "utf8")).toBe(
      "finished earlier"
    );
    expect(await readFile(path.join(directory, remainingName), "utf8")).toBe(
      "model bytes"
    );
  });

  it("downloads nothing more when the folder picker is canceled", async () => {
    picker.mockResolvedValue({ canceled: true, filePaths: [] });

    expect(
      await downloadSetupRequirements(window, settings, [
        LOCAL_SCRIPT_MODEL_FILES.videoVae,
        LOCAL_SCRIPT_MODEL_FILES.audioVae
      ])
    ).toBeNull();
  });

  it("names the file that failed and refuses a LoRA whose checksum does not match", async () => {
    await expect(
      downloadSetupRequirements(window, settings, [
        LOCAL_SCRIPT_MODEL_FILES.videoVae,
        "minimax_h3_head_swap_v1.0_r32.safetensors"
      ])
    ).rejects.toThrow(
      "minimax_h3_head_swap_v1.0_r32.safetensors: SHA-256 verification failed"
    );
  });
});
