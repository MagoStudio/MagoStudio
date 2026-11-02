import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const findComfyPython = vi.hoisted(() => vi.fn());
const installNodePackRequirements = vi.hoisted(() => vi.fn());
vi.mock("./findComfyPython", () => ({ findComfyPython }));
vi.mock("./installNodePackRequirements", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  installNodePackRequirements
}));

import { installManualNodePackDependencies } from "./installManualNodePackDependencies";

describe("installManualNodePackDependencies", () => {
  let comfyDirectory = "";
  let nodePackDirectory = "";
  beforeEach(async () => {
    comfyDirectory = await mkdtemp(path.join(os.tmpdir(), "comfy-"));
    nodePackDirectory = path.join(
      comfyDirectory,
      "custom_nodes",
      "ComfyUI-GGUF"
    );
    await mkdir(nodePackDirectory, { recursive: true });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ system: { python_version: "3.12.7 (main)" } })
      )
    );
  });
  afterEach(async () => {
    vi.unstubAllGlobals();
    vi.resetAllMocks();
    await rm(comfyDirectory, { recursive: true, force: true });
  });

  it("reports no requirements without looking for Python", async () => {
    await expect(
      installManualNodePackDependencies({
        nodePackDirectory,
        endpoint: "http://127.0.0.1:8188"
      })
    ).resolves.toEqual({ outcome: "no-requirements" });
    expect(findComfyPython).not.toHaveBeenCalled();
  });

  it("installs with the ComfyUI Python found beside the install", async () => {
    await writeFile(path.join(nodePackDirectory, "requirements.txt"), "gguf");
    findComfyPython.mockResolvedValue(
      "C:\\ComfyUI\\python_embeded\\python.exe"
    );
    installNodePackRequirements.mockResolvedValue("installed");

    await expect(
      installManualNodePackDependencies({
        nodePackDirectory,
        endpoint: "http://127.0.0.1:8188"
      })
    ).resolves.toEqual({ outcome: "installed" });
    expect(findComfyPython).toHaveBeenCalledWith({
      comfyDirectory,
      reportedPythonVersion: "3.12.7 (main)"
    });
  });

  it("returns the pip command when ComfyUI runs on another computer", async () => {
    await writeFile(path.join(nodePackDirectory, "requirements.txt"), "gguf");

    const result = await installManualNodePackDependencies({
      nodePackDirectory,
      endpoint: "http://192.168.1.20:8188"
    });

    expect(result).toEqual({
      outcome: "manual",
      pipCommand: expect.stringContaining("-m pip install -r")
    });
    expect(findComfyPython).not.toHaveBeenCalled();
    expect(installNodePackRequirements).not.toHaveBeenCalled();
  });

  it("returns the pip command when no matching Python is found", async () => {
    await writeFile(path.join(nodePackDirectory, "requirements.txt"), "gguf");
    findComfyPython.mockResolvedValue(null);

    await expect(
      installManualNodePackDependencies({
        nodePackDirectory,
        endpoint: "http://127.0.0.1:8188"
      })
    ).resolves.toMatchObject({ outcome: "manual" });
  });

  it("keeps the extracted pack and returns the pip command with the reason when pip fails", async () => {
    await writeFile(path.join(nodePackDirectory, "requirements.txt"), "gguf");
    findComfyPython.mockResolvedValue("C:\ComfyUI\python_embeded\python.exe");
    installNodePackRequirements.mockRejectedValue(
      new Error("No matching distribution")
    );

    await expect(
      installManualNodePackDependencies({
        nodePackDirectory,
        endpoint: "http://127.0.0.1:8188"
      })
    ).resolves.toEqual({
      outcome: "manual",
      pipCommand: expect.stringContaining("python_embeded"),
      failureReason: "No matching distribution"
    });
  });

  it("treats a malformed endpoint as a ComfyUI it cannot reach", async () => {
    await writeFile(path.join(nodePackDirectory, "requirements.txt"), "gguf");

    await expect(
      installManualNodePackDependencies({
        nodePackDirectory,
        endpoint: "127.0.0.1:8188"
      })
    ).resolves.toMatchObject({ outcome: "manual" });
  });
});
