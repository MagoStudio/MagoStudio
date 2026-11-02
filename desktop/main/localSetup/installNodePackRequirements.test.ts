import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { installNodePackRequirements } from "./installNodePackRequirements";

describe("installNodePackRequirements", () => {
  let nodePackDirectory = "";
  beforeEach(async () => {
    nodePackDirectory = await mkdtemp(path.join(os.tmpdir(), "node-pack-"));
  });
  afterEach(async () => {
    await rm(nodePackDirectory, { recursive: true, force: true });
  });

  it("skips pip when the node pack has no requirements file", async () => {
    const runPython = vi.fn();

    await expect(
      installNodePackRequirements({
        python: "python.exe",
        nodePackDirectory,
        runPython,
        log: () => {}
      })
    ).resolves.toBe("no-requirements");
    expect(runPython).not.toHaveBeenCalled();
  });

  it("runs pip with the given Python against the pack's requirements file", async () => {
    await writeFile(path.join(nodePackDirectory, "requirements.txt"), "gguf\n");
    const runPython = vi.fn().mockResolvedValue({ exitCode: 0, output: "ok" });

    await expect(
      installNodePackRequirements({
        python: "C:\\engine\\python_embeded\\python.exe",
        nodePackDirectory,
        runPython,
        log: () => {}
      })
    ).resolves.toBe("installed");
    expect(runPython).toHaveBeenCalledWith(
      "C:\\engine\\python_embeded\\python.exe",
      [
        "-s",
        "-m",
        "pip",
        "install",
        "-r",
        path.join(nodePackDirectory, "requirements.txt")
      ],
      undefined
    );
  });

  it("fails with pip's last lines when pip exits with an error", async () => {
    await writeFile(path.join(nodePackDirectory, "requirements.txt"), "gguf\n");
    const runPython = vi.fn().mockResolvedValue({
      exitCode: 1,
      output: "Collecting gguf\nERROR: No matching distribution found for gguf"
    });

    await expect(
      installNodePackRequirements({
        python: "python.exe",
        nodePackDirectory,
        runPython,
        log: () => {}
      })
    ).rejects.toThrow("No matching distribution found for gguf");
  });
});
