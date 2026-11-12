import { writeFile } from "node:fs/promises";
import path from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ probe: vi.fn(), run: vi.fn() }));
vi.mock("./runModelProbe", () => ({ runModelProbe: mocks.probe }));
vi.mock("../localSetup/installNodePackRequirements", () => ({
  runPythonProcess: mocks.run
}));

import { repairGpuRuntime } from "./repairGpuRuntime";

describe("repairGpuRuntime", () => {
  beforeEach(() => {
    mocks.probe.mockReset();
    mocks.run.mockReset();
  });
  it.each(["download", "verify", "install"])(
    "cancels during wheel %s and does not start the next subprocess",
    async (stage) => {
      const controller = new AbortController();
      mocks.probe.mockResolvedValue({
        status: "success",
        details: {
          cudaDriverVersion: 12040,
          cudaCapability: [8, 6],
          packages: { "llama-cpp-python": "0.4.1" },
          llamaGpu: false
        }
      });
      let reached = false;
      mocks.run.mockImplementation(
        async (_python: string, args: string[], signal: AbortSignal) => {
          const current = args.includes("download")
            ? "download"
            : args.includes("install")
              ? "install"
              : "verify";
          if (current === stage) {
            reached = true;
            return new Promise((_resolve, reject) =>
              signal.addEventListener("abort", () => reject(signal.reason), {
                once: true
              })
            );
          }
          if (current === "download")
            await writeFile(
              path.join(args[args.indexOf("--dest") + 1], "fixture.whl"),
              "wheel"
            );
          return { exitCode: 0, output: "ok" };
        }
      );
      const repair = repairGpuRuntime("python", "llama", controller.signal);
      const rejected = expect(repair).rejects.toThrow("cancelled");
      await vi.waitFor(() => expect(reached).toBe(true));
      controller.abort(new Error("cancelled"));
      await rejected;
      expect(mocks.run).toHaveBeenCalledTimes(
        ["download", "verify", "install"].indexOf(stage) + 1
      );
      expect(mocks.probe).toHaveBeenCalledTimes(1);
      expect(mocks.probe.mock.calls[0][3]).toBe(controller.signal);
    }
  );
  it("tries the newest then older GPU builds on the same index, never PyPI or a source build, when the installed version has none", async () => {
    mocks.probe.mockResolvedValue({
      status: "success",
      details: {
        cudaDriverVersion: 12040,
        cudaCapability: [8, 6],
        packages: { "llama-cpp-python": "0.4.1" },
        llamaGpu: false
      }
    });
    mocks.run.mockResolvedValue({
      exitCode: 1,
      output: "No matching distribution found"
    });
    const result = await repairGpuRuntime("comfy-python", "llama");
    expect(result.status).toBe("unsupported");
    expect(mocks.run).toHaveBeenCalledTimes(3);
    expect(mocks.run.mock.calls[0][1]).toEqual(
      expect.arrayContaining([
        "download",
        "--only-binary=:all:",
        "--index-url",
        "https://abetlen.github.io/llama-cpp-python/whl/cu124",
        "llama-cpp-python==0.4.1"
      ])
    );
    expect(mocks.run.mock.calls[1][1]).toEqual(
      expect.arrayContaining([
        "--only-binary=:all:",
        "https://abetlen.github.io/llama-cpp-python/whl/cu124",
        "llama-cpp-python!=0.4.1"
      ])
    );
    expect(mocks.run.mock.calls[2][1]).toEqual(
      expect.arrayContaining([
        "--only-binary=:all:",
        "https://abetlen.github.io/llama-cpp-python/whl/cu124",
        "llama-cpp-python<0.4.1"
      ])
    );
    for (const call of mocks.run.mock.calls)
      expect(call[1]).not.toContain("--extra-index-url");
  });
  it("installs the newest GPU build when the installed version has none", async () => {
    mocks.probe
      .mockResolvedValueOnce({
        status: "success",
        details: {
          cudaDriverVersion: 13040,
          cudaCapability: [12, 0],
          packages: { "llama-cpp-python": "0.3.19" },
          llamaGpu: false
        }
      })
      .mockResolvedValueOnce({
        status: "success",
        details: { llamaVersion: "0.3.36", llamaGpu: true }
      });
    mocks.run.mockImplementation(async (_python: string, args: string[]) => {
      const isDownload = args.includes("download");
      if (isDownload && args.includes("llama-cpp-python==0.3.19"))
        return {
          exitCode: 1,
          output: "No matching distribution found for llama-cpp-python==0.3.19"
        };
      if (isDownload)
        await writeFile(
          path.join(
            args[args.indexOf("--dest") + 1],
            "llama_cpp_python-0.3.36-cp313-cp313-win_amd64.whl"
          ),
          "binary wheel fixture"
        );
      return { exitCode: 0, output: "ok" };
    });
    const result = await repairGpuRuntime("comfy-python", "llama");
    expect(result.status).toBe("success");
    expect(result.message).toContain("llama-cpp-python 0.3.36");
    expect(result.message).toContain("the newest GPU build was installed");
    expect(result.details?.requirements).toEqual(["llama-cpp-python!=0.3.19"]);
    expect(
      mocks.run.mock.calls.some((call) =>
        call[1].includes("llama-cpp-python<0.3.19")
      )
    ).toBe(false);
  });
  it("installs the newest older GPU build when the newest build carries no GPU libraries", async () => {
    mocks.probe
      .mockResolvedValueOnce({
        status: "success",
        details: {
          cudaDriverVersion: 13040,
          cudaCapability: [12, 0],
          packages: { "llama-cpp-python": "0.4.1" },
          llamaGpu: false
        }
      })
      .mockResolvedValueOnce({
        status: "success",
        details: { llamaVersion: "0.3.36", llamaGpu: true }
      });
    mocks.run.mockImplementation(async (_python: string, args: string[]) => {
      const isDownload = args.includes("download");
      if (isDownload && args.includes("llama-cpp-python==0.4.1"))
        return {
          exitCode: 1,
          output: "No matching distribution found for llama-cpp-python==0.4.1"
        };
      if (isDownload)
        await writeFile(
          path.join(
            args[args.indexOf("--dest") + 1],
            "llama_cpp_python-0.3.36-cp313-cp313-win_amd64.whl"
          ),
          "binary wheel fixture"
        );
      const isWheelCheckOfNewestBuild =
        args.includes("-c") &&
        args.some((argument) => argument.includes("newest-version"));
      if (isWheelCheckOfNewestBuild)
        return { exitCode: 1, output: "GPU libraries absent from wheel" };
      return { exitCode: 0, output: "ok" };
    });
    const result = await repairGpuRuntime("comfy-python", "llama");
    expect(result.status).toBe("success");
    expect(result.message).toContain("llama-cpp-python 0.3.36");
    expect(result.message).toContain("No GPU build of 0.4.1");
    expect(result.message).toContain("the newest older GPU build");
    expect(result.details?.requirements).toEqual([
      "llama-cpp-python<0.4.1,!=0.3.36"
    ]);
  });
  it("keeps the installed version when the download fails for a reason other than a missing build", async () => {
    mocks.probe.mockResolvedValue({
      status: "success",
      details: {
        cudaDriverVersion: 12040,
        cudaCapability: [8, 6],
        packages: { "llama-cpp-python": "0.4.1" },
        llamaGpu: false
      }
    });
    mocks.run.mockResolvedValue({
      exitCode: 1,
      output: "Connection timed out while fetching the index"
    });
    const result = await repairGpuRuntime("comfy-python", "llama");
    expect(result.status).toBe("error");
    expect(result.message).toContain("installed package was not replaced");
    expect(mocks.run).toHaveBeenCalledTimes(1);
  });
  it("tries the newest older GPU build when the newest build installs but its GPU still fails", async () => {
    mocks.probe
      .mockResolvedValueOnce({
        status: "success",
        details: {
          cudaDriverVersion: 12040,
          cudaCapability: [8, 6],
          packages: { "llama-cpp-python": "0.4.1" },
          llamaGpu: false
        }
      })
      .mockResolvedValueOnce({
        status: "success",
        details: { llamaVersion: "0.4.2", llamaGpu: false }
      })
      .mockResolvedValueOnce({
        status: "success",
        details: { llamaVersion: "0.3.36", llamaGpu: true }
      });
    mocks.run.mockImplementation(async (_python: string, args: string[]) => {
      const isDownload = args.includes("download");
      if (isDownload && args.includes("llama-cpp-python==0.4.1"))
        return { exitCode: 1, output: "No matching distribution found" };
      if (isDownload) {
        const wheelName = args.includes("llama-cpp-python!=0.4.1")
          ? "llama_cpp_python-0.4.2-cp313-cp313-win_amd64.whl"
          : "llama_cpp_python-0.3.36-cp313-cp313-win_amd64.whl";
        await writeFile(
          path.join(args[args.indexOf("--dest") + 1], wheelName),
          "binary wheel fixture"
        );
      }
      return { exitCode: 0, output: "ok" };
    });
    const result = await repairGpuRuntime("comfy-python", "llama");
    expect(result.status).toBe("success");
    expect(result.message).toContain("llama-cpp-python 0.3.36");
    expect(result.details?.requirements).toEqual([
      "llama-cpp-python<0.4.1,!=0.4.2"
    ]);
  });
  it("installs the newest GPU build with its dependencies when llama-cpp-python is missing", async () => {
    mocks.probe
      .mockResolvedValueOnce({
        status: "success",
        details: {
          cudaDriverVersion: 13040,
          cudaCapability: [12, 0],
          packages: {},
          llamaGpu: false
        }
      })
      .mockResolvedValueOnce({
        status: "success",
        details: { llamaVersion: "0.3.36", llamaGpu: true }
      });
    mocks.run.mockImplementation(async (_python: string, args: string[]) => {
      if (args.includes("download"))
        await writeFile(
          path.join(
            args[args.indexOf("--dest") + 1],
            "llama_cpp_python-0.3.36-cp313-cp313-win_amd64.whl"
          ),
          "binary wheel fixture"
        );
      return { exitCode: 0, output: "ok" };
    });
    const result = await repairGpuRuntime("comfy-python", "llama");
    expect(result.status).toBe("success");
    expect(result.message).toContain("llama-cpp-python 0.3.36 was installed");
    expect(result.details?.requirements).toEqual(["llama-cpp-python"]);
    const installArguments = mocks.run.mock.calls.find((call) =>
      call[1].includes("install")
    )?.[1];
    expect(installArguments).toContain("--only-binary=:all:");
    expect(installArguments).not.toContain("--no-deps");
    expect(installArguments).not.toContain("--force-reinstall");
  });
  it("reports no GPU build when llama-cpp-python is missing and no index has one", async () => {
    mocks.probe.mockResolvedValue({
      status: "success",
      details: {
        cudaDriverVersion: 12040,
        cudaCapability: [8, 6],
        packages: {},
        llamaGpu: false
      }
    });
    mocks.run.mockResolvedValue({
      exitCode: 1,
      output: "No matching distribution found"
    });
    const result = await repairGpuRuntime("comfy-python", "llama");
    expect(result.status).toBe("unsupported");
    expect(result.message).toContain("llama-cpp-python is not installed");
    expect(mocks.run).toHaveBeenCalledTimes(1);
  });
  it("refuses an older CUDA binary for a Blackwell GPU", async () => {
    mocks.probe.mockResolvedValue({
      status: "success",
      details: {
        cudaDriverVersion: 12080,
        cudaCapability: [12, 0],
        packages: { "llama-cpp-python": "0.4.1" },
        llamaGpu: false
      }
    });
    expect((await repairGpuRuntime("comfy-python", "llama")).status).toBe(
      "unsupported"
    );
    expect(mocks.run).not.toHaveBeenCalled();
  });
  it("checks binary contents and verifies GPU loading instead of trusting a successful pip exit", async () => {
    mocks.probe.mockResolvedValue({
      status: "success",
      details: {
        cudaDriverVersion: 13000,
        cudaCapability: [12, 0],
        packages: { "llama-cpp-python": "0.4.1" },
        llamaGpu: false
      }
    });
    mocks.run.mockImplementation(async (_python: string, args: string[]) => {
      if (args.includes("download")) {
        const directory = args[args.indexOf("--dest") + 1];
        await writeFile(
          path.join(directory, "llama_cpp_python-0.4.1.whl"),
          "binary wheel fixture"
        );
      }
      return { exitCode: 0, output: "ok" };
    });
    const result = await repairGpuRuntime("comfy-python", "llama");
    expect(result.status).toBe("error");
    expect(result.message).toContain("initialization still fails");
    expect(
      mocks.run.mock.calls.find((call) => call[1].includes("install"))?.[1]
    ).toEqual(expect.arrayContaining(["--only-binary=:all:", "--no-deps"]));
    expect(mocks.probe).toHaveBeenCalledTimes(2);
  });
});
