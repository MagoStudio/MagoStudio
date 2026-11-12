import { mkdir, mkdtemp, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type { ModelOperationResult } from "../../shared/modelSettings";
import { asRecord } from "../comfy/asRecord";
import { runPythonProcess } from "../localSetup/installNodePackRequirements";

import { runModelProbe } from "./runModelProbe";

const CUDA_13_MINIMUM_MAJOR_CAPABILITY = 8;
const DOWNLOAD_ERROR_TAIL = 4000;
const INSTALL_ERROR_TAIL = 12000;
const CUDA_124_DRIVER = 12040;
const CUDA_125_DRIVER = 12050;
const CUDA_128_DRIVER = 12080;
const CUDA_13_DRIVER = 13000;
const RUNTIME_PROBE_TIMEOUT_MS = 60_000;
const WHEEL_DOWNLOAD_TIMEOUT_MS = 300_000;
const WHEEL_VERIFY_TIMEOUT_MS = 30_000;
const WHEEL_INSTALL_TIMEOUT_MS = 600_000;
const MISSING_WHEEL_PATTERN =
  /No matching distribution found|Could not find a version that satisfies/i;
const LLAMA_WHEEL_VERSION_PATTERN = /^llama_cpp_python-([^-]+)-/;

export const repairGpuRuntime = async (
  python: string,
  kind: "llama" | "torch",
  signal?: AbortSignal
): Promise<ModelOperationResult> => {
  const withTimeout = (timeout: number) => {
    signal?.throwIfAborted();
    return AbortSignal.any([
      AbortSignal.timeout(timeout),
      ...(signal ? [signal] : [])
    ]);
  };
  const probe = await runModelProbe(
    python,
    { action: "runtime" },
    RUNTIME_PROBE_TIMEOUT_MS,
    signal
  );
  const runtime = probe.details ?? {};
  if (
    (kind === "llama" && runtime.llamaGpu === true) ||
    (kind === "torch" && (runtime.torchGpu === true || runtime.metal === true))
  )
    return {
      status: "success",
      message: "GPU runtime initialization already passes",
      details: runtime
    };
  const driver = Number(runtime.cudaDriverVersion) || 0;
  const capability = Array.isArray(runtime.cudaCapability)
    ? Number(runtime.cudaCapability[0])
    : 0;
  const packages = asRecord(runtime.packages) ?? {};
  const channels =
    driver >= CUDA_13_DRIVER && capability >= CUDA_13_MINIMUM_MAJOR_CAPABILITY
      ? ["cu130", "cu125", "cu124"]
      : driver >= CUDA_128_DRIVER
        ? ["cu128", "cu125", "cu124"]
        : driver >= CUDA_125_DRIVER
          ? ["cu125", "cu124"]
          : driver >= CUDA_124_DRIVER
            ? ["cu124"]
            : runtime.metal === true
              ? ["metal"]
              : [];
  const BLACKWELL_MAJOR_CAPABILITY = 10;
  if (capability >= BLACKWELL_MAJOR_CAPABILITY)
    channels.splice(
      0,
      channels.length,
      ...channels.filter(
        (channel) => channel === "cu128" || channel === "cu130"
      )
    );
  if (kind === "llama")
    channels.splice(
      0,
      channels.length,
      ...channels.filter((channel) => channel !== "cu128")
    );
  else
    channels.splice(
      0,
      channels.length,
      ...channels.filter(
        (channel) => channel !== "cu125" && channel !== "metal"
      )
    );
  if (!channels.length)
    return {
      status: "unsupported",
      message:
        "No verified binary channel matches this GPU driver and runtime. Keep the current installation or use CPU mode.",
      details: runtime
    };
  const isLlamaPackageMissing =
    kind === "llama" && typeof packages["llama-cpp-python"] !== "string";
  const packageNames =
    kind === "llama"
      ? ["llama-cpp-python"]
      : ["torch", "torchvision", "torchaudio"].filter(
          (name) => typeof packages[name] === "string"
        );
  if (
    !packageNames.length ||
    (!isLlamaPackageMissing &&
      packageNames.some((name) => typeof packages[name] !== "string"))
  )
    return {
      status: "unsupported",
      message:
        "The package version could not be established; install the node's requirements first",
      details: runtime
    };
  const requirements = isLlamaPackageMissing
    ? ["llama-cpp-python"]
    : packageNames.map(
        (name) => `${name}==${String(packages[name]).split("+")[0]}`
      );
  const temporary = await mkdtemp(path.join(os.tmpdir(), "mago-model-wheel-"));
  const lastErrorByAttempt: Record<string, string> = {};
  const rejectedLlamaVersions = new Set<string>();
  let downloadFailedForReasonOtherThanMissingWheel = false;
  const rejectWheelVersions = (wheels: string[]) => {
    for (const wheel of wheels) {
      const wheelVersion = LLAMA_WHEEL_VERSION_PATTERN.exec(
        path.basename(wheel)
      )?.[1];
      if (wheelVersion) rejectedLlamaVersions.add(wheelVersion);
    }
  };
  const installGpuBuildFromChannels = async (
    pinnedRequirements: string[],
    attempt: string
  ): Promise<ModelOperationResult | null> => {
    for (const channel of channels) {
      const channelDirectory = path.join(temporary, attempt, channel);
      await mkdir(channelDirectory, { recursive: true });
      const index =
        kind === "llama"
          ? `https://abetlen.github.io/llama-cpp-python/whl/${channel}`
          : `https://download.pytorch.org/whl/${channel}`;
      const download = await runPythonProcess(
        python,
        [
          "-s",
          "-m",
          "pip",
          "download",
          "--only-binary=:all:",
          "--no-deps",
          "--no-cache-dir",
          "--index-url",
          index,
          "--dest",
          channelDirectory,
          ...pinnedRequirements
        ],
        withTimeout(WHEEL_DOWNLOAD_TIMEOUT_MS)
      );
      if (download.exitCode !== 0) {
        if (!MISSING_WHEEL_PATTERN.test(download.output))
          downloadFailedForReasonOtherThanMissingWheel = true;
        lastErrorByAttempt[attempt] =
          download.output.slice(-DOWNLOAD_ERROR_TAIL);
        continue;
      }
      const wheels = (await readdir(channelDirectory))
        .filter((file) => file.endsWith(".whl"))
        .map((file) => path.join(channelDirectory, file));
      const check = await runPythonProcess(
        python,
        [
          "-s",
          "-c",
          "import sys,zipfile; files=[n.lower() for p in sys.argv[1:] for n in zipfile.ZipFile(p).namelist()]; assert any(any(k in n for k in ('ggml-cuda','ggml-metal','torch_cuda','libtorch_cuda')) for n in files), 'GPU libraries absent from wheel'",
          ...wheels
        ],
        withTimeout(WHEEL_VERIFY_TIMEOUT_MS)
      );
      if (check.exitCode !== 0) {
        rejectWheelVersions(wheels);
        lastErrorByAttempt[attempt] = check.output.slice(-DOWNLOAD_ERROR_TAIL);
        continue;
      }
      const install = await runPythonProcess(
        python,
        [
          "-s",
          "-m",
          "pip",
          "install",
          "--only-binary=:all:",
          ...(isLlamaPackageMissing ? [] : ["--force-reinstall"]),
          "--no-cache-dir",
          ...(kind === "llama" && !isLlamaPackageMissing ? ["--no-deps"] : []),
          ...wheels
        ],
        withTimeout(WHEEL_INSTALL_TIMEOUT_MS)
      );
      if (install.exitCode !== 0) {
        rejectWheelVersions(wheels);
        return {
          status: "error",
          message: "GPU package installation failed",
          details: { output: install.output.slice(-INSTALL_ERROR_TAIL), index }
        };
      }
      const verified = await runModelProbe(
        python,
        { action: "runtime" },
        RUNTIME_PROBE_TIMEOUT_MS,
        signal
      );
      const available =
        kind === "llama"
          ? verified.details?.llamaGpu === true
          : verified.details?.torchGpu === true;
      if (!available) rejectWheelVersions(wheels);
      return {
        status: available ? "success" : "error",
        message: available
          ? "GPU runtime verified. Restart ComfyUI before loading models."
          : "The GPU package installed, but GPU initialization still fails. Inspect the runtime details.",
        details: {
          ...verified.details,
          index,
          requirements: pinnedRequirements
        }
      };
    }
    return null;
  };
  const installOtherLlamaVersion =
    async (): Promise<ModelOperationResult | null> => {
      const installedLlamaPackage = packages["llama-cpp-python"];
      const installedLlamaVersion =
        typeof installedLlamaPackage === "string"
          ? installedLlamaPackage.split("+")[0]
          : "";
      if (!installedLlamaVersion) return null;
      const otherVersionAttempts = [
        {
          attempt: "newest-version",
          versionBound: `!=${installedLlamaVersion}`,
          installedBuildDescription: "the newest GPU build"
        },
        {
          attempt: "older-version",
          versionBound: `<${installedLlamaVersion}`,
          installedBuildDescription: "the newest older GPU build"
        }
      ];
      let failedOtherVersionResult: ModelOperationResult | null = null;
      for (const otherVersionAttempt of otherVersionAttempts) {
        const versionSpecifiers = new Set([
          otherVersionAttempt.versionBound,
          ...[...rejectedLlamaVersions].map(
            (rejectedVersion) => `!=${rejectedVersion}`
          )
        ]);
        const otherVersionResult = await installGpuBuildFromChannels(
          [`llama-cpp-python${[...versionSpecifiers].join(",")}`],
          otherVersionAttempt.attempt
        );
        if (!otherVersionResult) continue;
        if (otherVersionResult.status !== "success") {
          failedOtherVersionResult = otherVersionResult;
          continue;
        }
        const reportedVersion = otherVersionResult.details?.llamaVersion;
        const installedOtherVersion =
          typeof reportedVersion === "string"
            ? reportedVersion
            : "another version";
        return {
          ...otherVersionResult,
          message: `GPU runtime verified with llama-cpp-python ${installedOtherVersion}. No GPU build of ${installedLlamaVersion} exists for this GPU, so ${otherVersionAttempt.installedBuildDescription} was installed. Restart ComfyUI before loading models.`
        };
      }
      return failedOtherVersionResult;
    };
  const describeAttemptErrors = () =>
    Object.entries(lastErrorByAttempt)
      .map(([attempt, error]) => `[${attempt}]\n${error}`)
      .join("\n\n");
  const installMissingLlamaPackage =
    async (): Promise<ModelOperationResult> => {
      const freshInstallResult = await installGpuBuildFromChannels(
        requirements,
        "newest-version"
      );
      if (freshInstallResult?.status === "success") {
        const reportedVersion = freshInstallResult.details?.llamaVersion;
        const installedVersion =
          typeof reportedVersion === "string" ? ` ${reportedVersion}` : "";
        return {
          ...freshInstallResult,
          message: `llama-cpp-python${installedVersion} was installed with GPU support. Restart ComfyUI before loading models.`
        };
      }
      if (freshInstallResult) return freshInstallResult;
      if (downloadFailedForReasonOtherThanMissingWheel)
        return {
          status: "error",
          message:
            "Downloading the llama-cpp-python GPU build failed for a reason other than a missing build. Check the network connection and try again.",
          details: { requirements, output: describeAttemptErrors(), runtime }
        };
      return {
        status: "unsupported",
        message:
          "llama-cpp-python is not installed, and no GPU build of it exists for this Python, OS and GPU.",
        details: { requirements, output: describeAttemptErrors(), runtime }
      };
    };
  try {
    if (isLlamaPackageMissing) return await installMissingLlamaPackage();
    const sameVersionResult = await installGpuBuildFromChannels(
      requirements,
      "installed-version"
    );
    if (sameVersionResult) return sameVersionResult;
    if (downloadFailedForReasonOtherThanMissingWheel)
      return {
        status: "error",
        message:
          "Downloading the GPU build failed for a reason other than a missing build. Check the network connection and try again. The installed package was not replaced.",
        details: { requirements, output: describeAttemptErrors(), runtime }
      };
    if (kind === "llama") {
      const otherLlamaVersionResult = await installOtherLlamaVersion();
      if (otherLlamaVersionResult) return otherLlamaVersionResult;
    }
    return {
      status: "unsupported",
      message:
        kind === "llama"
          ? "No GPU build of llama-cpp-python exists for this Python, OS and GPU, at the installed version or any other one. The installed package was not replaced."
          : "No compatible binary exists for the installed package version, Python ABI, OS and GPU. The installed package was not replaced.",
      details: { requirements, output: describeAttemptErrors(), runtime }
    };
  } finally {
    const target = path.resolve(temporary),
      parent = path.resolve(os.tmpdir());
    if (
      path.dirname(target) === parent &&
      path.basename(target).startsWith("mago-model-wheel-")
    )
      await rm(target, { recursive: true, force: true });
  }
};
