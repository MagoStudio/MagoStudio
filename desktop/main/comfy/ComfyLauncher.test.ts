import { EventEmitter } from "node:events";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ComfyLauncher } from "./ComfyLauncher";

const mocks = vi.hoisted(() => ({
  spawn: vi.fn(),
  stat: vi.fn(),
  readFile: vi.fn(),
  mkdir: vi.fn(),
  open: vi.fn()
}));
vi.mock("node:child_process", () => ({ spawn: mocks.spawn }));
vi.mock("node:fs/promises", () => ({
  stat: mocks.stat,
  readFile: mocks.readFile,
  mkdir: mocks.mkdir,
  open: mocks.open
}));

const comfyOutputLogPath = path.join("C:/AppData/Mago", "logs", "comfyui.log");
const comfyOutputLogFd = 77;
const installerMarker = JSON.stringify({ sha256: "a".repeat(64) });
let comfyOutputLogContent = "";

const comfyOutputLogReader = () => {
  const comfyOutputLogBytes = Buffer.from(comfyOutputLogContent, "utf8");
  return {
    stat: vi.fn().mockResolvedValue({ size: comfyOutputLogBytes.length }),
    read: vi.fn(
      async (
        buffer: Buffer,
        offset: number,
        length: number,
        position: number
      ) => ({
        buffer,
        bytesRead: comfyOutputLogBytes.copy(
          buffer,
          offset,
          position,
          position + length
        )
      })
    ),
    close: vi.fn().mockResolvedValue(undefined)
  };
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("process", { ...process, platform: "win32" });
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Offline")));
  mocks.readFile.mockResolvedValue(installerMarker);
  mocks.mkdir.mockResolvedValue(undefined);
  comfyOutputLogContent = "";
  mocks.open.mockImplementation(async (_file: string, mode: string) =>
    mode === "r"
      ? comfyOutputLogReader()
      : { fd: comfyOutputLogFd, close: vi.fn().mockResolvedValue(undefined) }
  );
  mocks.stat.mockResolvedValue({ isFile: () => true });
  mocks.spawn.mockImplementation(() => {
    const child = Object.assign(new EventEmitter(), {
      exitCode: null,
      unref: vi.fn()
    });
    queueMicrotask(() => child.emit("spawn"));
    return child;
  });
});
afterEach(() => vi.unstubAllGlobals());

const settings = {
  getInferredComfyInstall: async () => null,
  getLocalModelsRoot: async () => "C:/Models & storage",
  getComfyEndpoint: async () => "http://127.0.0.1:8188"
};

describe("ComfyUI batch launcher", () => {
  it("does not offer launch for a selected folder without an installed engine", async () => {
    mocks.readFile.mockRejectedValue(new Error("No installer marker"));
    expect(
      await new ComfyLauncher(settings, comfyOutputLogPath).canLaunch()
    ).toBe(false);
  });

  it("offers launch for a verified local folder inferred during setup", async () => {
    const launcher = new ComfyLauncher(
      {
        ...settings,
        getLocalModelsRoot: async () => null,
        getInferredComfyInstall: async () => ({
          endpoint: "http://127.0.0.1:8188",
          directory: path.resolve("C:/ExistingComfy")
        })
      },
      comfyOutputLogPath
    );
    expect(await launcher.canLaunch()).toBe(true);
    mocks.stat.mockRejectedValue(new Error("Folder removed"));
    expect(await launcher.canLaunch()).toBe(false);
  });

  it("does not offer a local launch for a remote endpoint", async () => {
    expect(
      await new ComfyLauncher(
        {
          ...settings,
          getComfyEndpoint: async () => "https://comfy.example.com"
        },
        comfyOutputLogPath
      ).canLaunch()
    ).toBe(false);
  });

  it("uses the saved install directory and prevents concurrent or repeated launches", async () => {
    const launcher = new ComfyLauncher(settings, comfyOutputLogPath);
    await Promise.all([launcher.launch(), launcher.launch()]);
    await launcher.launch();
    expect(mocks.spawn).toHaveBeenCalledTimes(1);
    expect(mocks.spawn).toHaveBeenCalledWith(
      "cmd.exe",
      ["/d", "/s", "/c", "run_nvidia_gpu.bat"],
      {
        cwd: path.join(
          "C:/Models & storage",
          "MagoStudio",
          "ComfyUI_windows_portable"
        ),
        detached: true,
        stdio: ["ignore", comfyOutputLogFd, comfyOutputLogFd],
        windowsHide: true
      }
    );
    expect(mocks.open).toHaveBeenCalledWith(comfyOutputLogPath, "w");
    mocks.spawn.mock.results[0]!.value.emit("exit", 1);
    await launcher.launch();
    expect(mocks.spawn).toHaveBeenCalledTimes(2);
  });

  it("reports when its own process exits until the next launch", async () => {
    const launcher = new ComfyLauncher(settings, comfyOutputLogPath);
    expect(launcher.getLaunchedProcess()).toBeNull();
    await launcher.launch();
    expect(launcher.getLaunchedProcess()).toEqual({ status: "running" });
    comfyOutputLogContent = `${"100%|##########| 8/8 [00:01<00:00]\r".repeat(10_000)}\nTraceback (most recent call last):\r\n  File "main.py", line 1\r\nRuntimeError: Found no NVIDIA driver on your system.\r\n`;
    const launchedProcess = mocks.spawn.mock.results[0]!.value;
    launchedProcess.exitCode = 1;
    launchedProcess.emit("exit", 1);
    await vi.waitFor(() =>
      expect(launcher.getLaunchedProcess()).toEqual({
        status: "exited",
        exitCode: 1,
        reportedFailureReason: "Found no NVIDIA driver on your system."
      })
    );
    await launcher.launch();
    expect(launcher.getLaunchedProcess()).toEqual({ status: "running" });
  });

  it("restarts its own unresponsive process when asked", async () => {
    const launcher = new ComfyLauncher(settings, comfyOutputLogPath);
    await launcher.launch();
    const unresponsiveProcess = Object.assign(
      mocks.spawn.mock.results[0]!.value,
      { pid: 4242 }
    );
    mocks.spawn.mockImplementationOnce(() => {
      const processTreeKiller = new EventEmitter();
      queueMicrotask(() => {
        unresponsiveProcess.exitCode = 1;
        unresponsiveProcess.emit("exit", 1);
        processTreeKiller.emit("exit", 0);
      });
      return processTreeKiller;
    });
    await launcher.launch();
    expect(mocks.spawn).toHaveBeenCalledTimes(1);
    await launcher.launch({ restartUnresponsiveProcess: true });
    expect(mocks.spawn).toHaveBeenNthCalledWith(
      2,
      "taskkill.exe",
      ["/pid", "4242", "/t", "/f"],
      { stdio: "ignore", windowsHide: true }
    );
    expect(mocks.spawn).toHaveBeenNthCalledWith(
      3,
      "cmd.exe",
      ["/d", "/s", "/c", "run_nvidia_gpu.bat"],
      expect.anything()
    );
  });

  it("does not report a process it stopped itself as exited when relaunching fails", async () => {
    const launcher = new ComfyLauncher(settings, comfyOutputLogPath);
    await launcher.launch();
    const unresponsiveProcess = Object.assign(
      mocks.spawn.mock.results[0]!.value,
      { pid: 4242 }
    );
    mocks.spawn.mockImplementationOnce(() => {
      const processTreeKiller = new EventEmitter();
      queueMicrotask(() => {
        unresponsiveProcess.exitCode = 1;
        unresponsiveProcess.emit("exit", 1);
        processTreeKiller.emit("exit", 0);
      });
      return processTreeKiller;
    });
    mocks.stat.mockRejectedValue(new Error("Not found"));
    await expect(
      launcher.launch({ restartUnresponsiveProcess: true })
    ).rejects.toThrow("launcher was not found");
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(launcher.getLaunchedProcess()).toBeNull();
  });

  it("does not restart a process whose server already responds", async () => {
    const launcher = new ComfyLauncher(settings, comfyOutputLogPath);
    await launcher.launch();
    vi.mocked(fetch).mockResolvedValue(new Response("{}"));
    await launcher.launch({ restartUnresponsiveProcess: true });
    expect(mocks.spawn).toHaveBeenCalledTimes(1);
  });

  it("does not start another server if the saved endpoint already responds", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("{}"));
    await new ComfyLauncher(settings, comfyOutputLogPath).launch();
    expect(mocks.spawn).not.toHaveBeenCalled();
  });

  it("reports a missing batch file without launching a command", async () => {
    mocks.stat.mockRejectedValue(new Error("Not found"));
    await expect(
      new ComfyLauncher(settings, comfyOutputLogPath).launch()
    ).rejects.toThrow("launcher was not found");
    expect(mocks.spawn).not.toHaveBeenCalled();
  });

  it("reports process creation failures and permits retrying", async () => {
    mocks.spawn.mockImplementationOnce(() => {
      const child = Object.assign(new EventEmitter(), { exitCode: null });
      queueMicrotask(() => child.emit("error", new Error("Cannot start")));
      return child;
    });
    const launcher = new ComfyLauncher(settings, comfyOutputLogPath);
    await expect(launcher.launch()).rejects.toThrow("Cannot start");
    await launcher.launch();
    expect(mocks.spawn).toHaveBeenCalledTimes(2);
  });
});

describe("restarting the ComfyUI Mago launched", () => {
  it("fails instead of reporting a restart when Mago is not running ComfyUI", async () => {
    const launcher = new ComfyLauncher(settings, comfyOutputLogPath);

    await expect(launcher.restartLaunchedProcess()).rejects.toThrow(
      "no longer running from Mago"
    );
    expect(mocks.spawn).not.toHaveBeenCalled();
  });
});
