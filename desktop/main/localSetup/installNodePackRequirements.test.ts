import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const native = vi.hoisted(() => ({
  probe: vi.fn(),
  repair: vi.fn(),
  cpu: vi.fn()
}));
vi.mock("../modelSettings/runModelProbe", () => ({
  runModelProbe: native.probe
}));
vi.mock("../modelSettings/repairLlamaRuntime", () => ({
  repairLlamaRuntime: native.repair
}));
vi.mock("../modelSettings/modelRuntimeHooks", () => ({
  allowsCpuTextInstall: native.cpu
}));

import { installNodePackRequirements } from "./installNodePackRequirements";

describe("installNodePackRequirements", () => {
  let nodePackDirectory = "";
  beforeEach(async () => {
    vi.resetAllMocks();
    native.cpu.mockResolvedValue(false);
    nodePackDirectory = await mkdtemp(path.join(os.tmpdir(), "node-pack-"));
  });

  it("repairs and verifies a CPU-only llama install on a CUDA computer", async () => {
    const signal = new AbortController().signal;
    await writeFile(
      path.join(nodePackDirectory, "requirements.txt"),
      "llama-cpp-python\n"
    );
    native.probe.mockResolvedValue({
      status: "success",
      details: { cudaDriverVersion: 12040, llamaGpu: false }
    });
    native.repair.mockResolvedValue({
      status: "success",
      message: "GPU initialized"
    });
    await expect(
      installNodePackRequirements({
        python: "comfy-python",
        nodePackDirectory,
        signal,
        runPython: vi.fn().mockResolvedValue({ exitCode: 0, output: "ok" }),
        log: () => {}
      })
    ).resolves.toBe("installed");
    expect(native.probe).toHaveBeenCalledWith(
      "comfy-python",
      { action: "runtime" },
      expect.any(Number),
      signal
    );
    expect(native.repair).toHaveBeenCalledWith("comfy-python", signal);
  });

  it("does not report installation success when GPU repair cannot verify a backend", async () => {
    await writeFile(
      path.join(nodePackDirectory, "requirements.txt"),
      "llama-cpp-python\n"
    );
    native.probe.mockResolvedValue({
      status: "success",
      details: { cudaDriverVersion: 12040, llamaGpu: false }
    });
    native.repair.mockResolvedValue({
      status: "unsupported",
      message: "No matching GPU wheel"
    });
    await expect(
      installNodePackRequirements({
        python: "comfy-python",
        nodePackDirectory,
        runPython: vi.fn().mockResolvedValue({ exitCode: 0, output: "ok" }),
        log: () => {}
      })
    ).rejects.toThrow("No matching GPU wheel");
  });

  it("allows an explicitly chosen CPU backend but rejects a broken native import", async () => {
    await writeFile(
      path.join(nodePackDirectory, "requirements.txt"),
      "llama-cpp-python\n"
    );
    native.cpu.mockResolvedValue(true);
    native.probe.mockResolvedValue({
      status: "success",
      details: { cudaDriverVersion: 12040, llamaGpu: false }
    });
    const request = {
      python: "comfy-python",
      nodePackDirectory,
      runPython: vi.fn().mockResolvedValue({ exitCode: 0, output: "ok" }),
      log: () => {}
    };
    await expect(installNodePackRequirements(request)).resolves.toBe(
      "installed"
    );
    expect(native.repair).not.toHaveBeenCalled();
    native.probe.mockResolvedValue({
      status: "success",
      details: { llamaError: "DLL load failed" }
    });
    await expect(installNodePackRequirements(request)).rejects.toThrow(
      "DLL load failed"
    );
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
