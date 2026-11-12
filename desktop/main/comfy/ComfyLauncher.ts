import { spawn, type ChildProcess } from "node:child_process";
import { mkdir, open, readFile, stat } from "node:fs/promises";
import path from "node:path";

import type { ComfyLaunchedProcess } from "../../shared/contracts";
import type { LibrarySettings } from "../librarySettings";
import { readModelMemoryPolicy } from "../modelSettings/modelRuntimeHooks";
import { resolveAppFolder } from "../resolveAppFolder";

import { extractComfyStartupFailureReason } from "./extractComfyStartupFailureReason";
import { findListeningProcessId } from "./findListeningProcessId";
import { killProcessTree } from "./killProcessTree";
import { normalizeComfyEndpoint } from "./normalizeComfyEndpoint";
import { resolveEndpointPort } from "./resolveEndpointPort";

const availabilityTimeoutMs = 3_000;
const processExitTimeoutMs = 5_000;
const endpointShutdownTimeoutMs = 15_000;
const endpointShutdownPollMs = 500;
const comfyOutputTailBytes = 65_536;

export class ComfyLauncher {
  private child: ChildProcess | null = null;
  private launchedProcessExit: {
    exitCode: number | null;
    reportedFailureReason: string | null;
  } | null = null;
  private starting: Promise<void> | null = null;

  constructor(
    private readonly settings: Pick<
      LibrarySettings,
      "getLocalModelsRoot" | "getComfyEndpoint" | "getInferredComfyInstall"
    >,
    private readonly comfyOutputLogPath: string
  ) {}

  private async readComfyOutputTail(): Promise<string> {
    const comfyOutputLog = await open(this.comfyOutputLogPath, "r");
    try {
      const { size: comfyOutputLogSize } = await comfyOutputLog.stat();
      const tailLength = Math.min(comfyOutputLogSize, comfyOutputTailBytes);
      const { buffer, bytesRead } = await comfyOutputLog.read(
        Buffer.alloc(tailLength),
        0,
        tailLength,
        comfyOutputLogSize - tailLength
      );
      return buffer.toString("utf8", 0, bytesRead);
    } finally {
      await comfyOutputLog.close();
    }
  }

  private async readReportedFailureReason(): Promise<string | null> {
    try {
      return extractComfyStartupFailureReason(await this.readComfyOutputTail());
    } catch {
      return null;
    }
  }

  private async launchDirectory(): Promise<string | null> {
    if (process.platform !== "win32") return null;
    const endpoint = normalizeComfyEndpoint(
      await this.settings.getComfyEndpoint()
    );
    if (
      !["localhost", "127.0.0.1", "[::1]"].includes(new URL(endpoint).hostname)
    )
      return null;
    const inferred = await this.settings.getInferredComfyInstall();
    const root = await this.settings.getLocalModelsRoot();
    const candidates: string[] = [];
    if (inferred?.endpoint === endpoint && path.isAbsolute(inferred.directory))
      candidates.push(inferred.directory);
    if (root) {
      const base = resolveAppFolder(root);
      try {
        const marker = JSON.parse(
          await readFile(
            path.join(base, ".downloads", "engine-installed.json"),
            "utf8"
          )
        );
        if (
          typeof marker.sha256 === "string" &&
          /^[a-f0-9]{64}$/.test(marker.sha256)
        )
          candidates.push(path.join(base, "ComfyUI_windows_portable"));
      } catch {
        /* No completed engine installation. */
      }
    }
    for (const directory of candidates) {
      const files = await Promise.all(
        [
          "run_nvidia_gpu.bat",
          "python_embeded/python.exe",
          "ComfyUI/main.py"
        ].map((file) => stat(path.join(directory, file)).catch(() => null))
      );
      if (files.every((file) => file?.isFile())) return directory;
    }
    return null;
  }

  async canLaunch(): Promise<boolean> {
    return (await this.launchDirectory()) !== null;
  }

  async getLaunchPath(): Promise<string | null> {
    const directory = await this.launchDirectory();
    return directory ? path.join(directory, "run_nvidia_gpu.bat") : null;
  }

  launch(options?: { restartUnresponsiveProcess?: boolean }): Promise<void> {
    if (this.starting) return this.starting;
    this.starting = this.start(
      options?.restartUnresponsiveProcess === true
    ).finally(() => {
      this.starting = null;
    });
    return this.starting;
  }

  async restartLaunchedProcess(): Promise<void> {
    if (!this.isLaunchedProcessRunning())
      throw new Error(
        "ComfyUI is no longer running from Mago. Launch it again to load the new node packs."
      );
    await this.stopLaunchedProcess();
    await this.waitUntilEndpointStopsAnswering();
    await this.launch();
    if (!this.isLaunchedProcessRunning())
      throw new Error(
        "ComfyUI didn't start again. Launch it to load the new node packs."
      );
  }

  async relaunchProcessStartedOutsideMago(): Promise<void> {
    if (!(await this.canLaunch()))
      throw new Error(
        "Mago doesn't know where this ComfyUI is installed. Restart it yourself to load the new node packs."
      );
    const endpoint = normalizeComfyEndpoint(
      await this.settings.getComfyEndpoint()
    );
    const processId = await findListeningProcessId(
      resolveEndpointPort(endpoint)
    );
    if (processId === null)
      throw new Error(
        "Mago couldn't find the running ComfyUI process. Restart it yourself to load the new node packs."
      );
    await killProcessTree(processId);
    await this.waitUntilEndpointStopsAnswering();
    await this.launch();
    if (!this.isLaunchedProcessRunning())
      throw new Error(
        "ComfyUI didn't start again. Launch it to load the new node packs."
      );
  }

  async waitUntilEndpointStopsAnswering(): Promise<void> {
    const endpoint = normalizeComfyEndpoint(
      await this.settings.getComfyEndpoint()
    );
    const deadline = Date.now() + endpointShutdownTimeoutMs;
    while (Date.now() < deadline) {
      const isStillAnswering = await fetch(endpoint + "/system_stats", {
        signal: AbortSignal.timeout(availabilityTimeoutMs)
      })
        .then((response) => response.ok)
        .catch(() => false);
      if (!isStillAnswering) return;
      await new Promise((resolve) =>
        setTimeout(resolve, endpointShutdownPollMs)
      );
    }
    throw new Error(
      "The previous ComfyUI is still answering. Close it, then launch ComfyUI again."
    );
  }

  isLaunchedProcessRunning(): boolean {
    return this.child !== null && this.child.exitCode === null;
  }

  getLaunchedProcess(): ComfyLaunchedProcess | null {
    if (this.isLaunchedProcessRunning()) return { status: "running" };
    return this.launchedProcessExit
      ? { status: "exited", ...this.launchedProcessExit }
      : null;
  }

  private async stopLaunchedProcess(): Promise<void> {
    const child = this.child;
    if (!child || child.exitCode !== null || child.pid === undefined) return;
    this.child = null;
    const launchedProcessExited = new Promise<void>((resolve) =>
      child.once("exit", () => resolve())
    );
    await killProcessTree(child.pid);
    await Promise.race([
      launchedProcessExited,
      new Promise<void>((resolve) => setTimeout(resolve, processExitTimeoutMs))
    ]);
  }

  private async start(restartUnresponsiveProcess: boolean): Promise<void> {
    if (!restartUnresponsiveProcess && this.isLaunchedProcessRunning()) return;
    if (process.platform !== "win32")
      throw new Error("Launching the bundled ComfyUI requires Windows.");
    const endpoint = normalizeComfyEndpoint(
      await this.settings.getComfyEndpoint()
    );
    try {
      const response = await fetch(endpoint + "/system_stats", {
        signal: AbortSignal.timeout(availabilityTimeoutMs)
      });
      if (response.ok) return;
    } catch {}
    if (this.isLaunchedProcessRunning()) await this.stopLaunchedProcess();
    const directory = await this.launchDirectory();
    if (!directory)
      throw new Error(
        "ComfyUI launcher was not found. Complete setup or check your local ComfyUI installation first."
      );
    await mkdir(path.dirname(this.comfyOutputLogPath), { recursive: true });
    const comfyOutputLog = await open(this.comfyOutputLogPath, "w");
    try {
      const lowVram = (await readModelMemoryPolicy(endpoint)) === "low-vram";
      const launchScript = lowVram
        ? await readFile(path.join(directory, "run_nvidia_gpu.bat"), "utf8")
        : "";
      const scriptFlags = /ComfyUI[\\/]main\.py["']?\s+([^\r\n]*)/i
        .exec(launchScript)?.[1]
        ?.match(/"[^"]*"|'[^']*'|\S+/g)
        ?.filter(
          (value) =>
            !/^--(?:lowvram|normalvram|highvram|novram|gpu-only|cpu)$/.test(
              value
            ) && !/[&|<>%]/.test(value)
        )
        .map((value) => value.replace(/^["']|["']$/g, "")) ?? [
        "--windows-standalone-build"
      ];
      const child = spawn(
        lowVram
          ? path.join(directory, "python_embeded", "python.exe")
          : "cmd.exe",
        lowVram
          ? ["-s", "ComfyUI/main.py", ...scriptFlags, "--lowvram"]
          : ["/d", "/s", "/c", "run_nvidia_gpu.bat"],
        {
          cwd: directory,
          detached: true,
          stdio: ["ignore", comfyOutputLog.fd, comfyOutputLog.fd],
          windowsHide: true
        }
      );
      this.child = child;
      this.launchedProcessExit = null;
      child.once("exit", (exitCode: number | null) => {
        if (this.child !== child) return;
        this.child = null;
        void this.readReportedFailureReason().then((reportedFailureReason) => {
          if (this.child === null)
            this.launchedProcessExit = { exitCode, reportedFailureReason };
        });
      });
      try {
        await new Promise<void>((resolve, reject) => {
          child.once("spawn", resolve);
          child.once("error", reject);
        });
        child.unref();
      } catch (error) {
        if (this.child === child) this.child = null;
        throw error;
      }
    } finally {
      await comfyOutputLog.close();
    }
  }
}
