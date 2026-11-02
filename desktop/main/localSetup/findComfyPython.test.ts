import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { comfyPythonCandidates, findComfyPython } from "./findComfyPython";

const REPORTED_PYTHON_VERSION =
  "3.12.7 (tags/v3.12.7:0b05ead, Oct  1 2024) [MSC v.1941 64 bit (AMD64)]";

describe("findComfyPython", () => {
  let installDirectory = "";
  let comfyDirectory = "";
  beforeEach(async () => {
    installDirectory = await mkdtemp(path.join(os.tmpdir(), "comfy-install-"));
    comfyDirectory = path.join(installDirectory, "ComfyUI");
    await mkdir(comfyDirectory);
  });
  afterEach(async () => {
    await rm(installDirectory, { recursive: true, force: true });
  });

  const placePython = async (pythonPath: string) => {
    await mkdir(path.dirname(pythonPath), { recursive: true });
    await writeFile(pythonPath, "");
  };

  it("finds the portable build's embedded Python when its version matches ComfyUI's", async () => {
    const [embeddedPython] = comfyPythonCandidates(comfyDirectory);
    await placePython(embeddedPython);
    const runPython = vi
      .fn()
      .mockResolvedValue({ exitCode: 0, output: "Python 3.12.7" });

    await expect(
      findComfyPython({
        comfyDirectory,
        reportedPythonVersion: REPORTED_PYTHON_VERSION,
        runPython
      })
    ).resolves.toBe(embeddedPython);
    expect(runPython).toHaveBeenCalledWith(embeddedPython, ["--version"]);
  });

  it("skips a Python whose version differs from the one running ComfyUI", async () => {
    const candidates = comfyPythonCandidates(comfyDirectory);
    await placePython(candidates[0]);
    await placePython(candidates[2]);
    const runPython = vi.fn(async (python: string) => ({
      exitCode: 0,
      output: python === candidates[0] ? "Python 3.11.9" : "Python 3.12.7"
    }));

    await expect(
      findComfyPython({
        comfyDirectory,
        reportedPythonVersion: REPORTED_PYTHON_VERSION,
        runPython
      })
    ).resolves.toBe(candidates[2]);
  });

  it("gives up when ComfyUI does not report its Python version", async () => {
    await placePython(comfyPythonCandidates(comfyDirectory)[0]);
    const runPython = vi.fn();

    await expect(
      findComfyPython({
        comfyDirectory,
        reportedPythonVersion: null,
        runPython
      })
    ).resolves.toBeNull();
    expect(runPython).not.toHaveBeenCalled();
  });

  it("gives up when no known Python location exists", async () => {
    await expect(
      findComfyPython({
        comfyDirectory,
        reportedPythonVersion: REPORTED_PYTHON_VERSION,
        runPython: vi.fn()
      })
    ).resolves.toBeNull();
  });
});
