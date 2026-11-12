import { spawn } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

import { allowsCpuTextInstall } from "../modelSettings/modelRuntimeHooks";
import { repairLlamaRuntime } from "../modelSettings/repairLlamaRuntime";
import { runModelProbe } from "../modelSettings/runModelProbe";

export type PythonProcessRunner = (
  python: string,
  args: string[],
  signal?: AbortSignal
) => Promise<{ exitCode: number | null; output: string }>;

const LLAMA_PROBE_TIMEOUT_MS = 60_000;

const PIP_ERROR_TAIL_LINES = 6;

export const runPythonProcess: PythonProcessRunner = (python, args, signal) =>
  new Promise((resolve, reject) => {
    const child = spawn(python, args, { windowsHide: true, signal });
    let output = "";
    child.stdout.on("data", (chunk: Buffer) => (output += chunk.toString()));
    child.stderr.on("data", (chunk: Buffer) => (output += chunk.toString()));
    child.once("error", reject);
    child.once("close", (exitCode) => resolve({ exitCode, output }));
  });

export const requirementsFileOfNodePack = (nodePackDirectory: string) =>
  path.join(nodePackDirectory, "requirements.txt");

export const describePipInstallCommand = (
  python: string,
  nodePackDirectory: string
) =>
  `"${python}" -s -m pip install -r "${requirementsFileOfNodePack(nodePackDirectory)}"`;

export const installNodePackRequirements = async ({
  python,
  nodePackDirectory,
  signal,
  runPython = runPythonProcess,
  log = console.info
}: {
  python: string;
  nodePackDirectory: string;
  signal?: AbortSignal;
  runPython?: PythonProcessRunner;
  log?: (message: string) => void;
}): Promise<"installed" | "no-requirements"> => {
  const requirementsFile = requirementsFileOfNodePack(nodePackDirectory);
  const hasRequirementsFile = await stat(requirementsFile)
    .then((info) => info.isFile())
    .catch(() => false);
  if (!hasRequirementsFile) return "no-requirements";
  const { exitCode, output } = await runPython(
    python,
    ["-s", "-m", "pip", "install", "-r", requirementsFile],
    signal
  );
  log(`pip install for ${path.basename(nodePackDirectory)}:\n${output}`);
  if (exitCode === 0) {
    if (
      /llama[-_]cpp[-_]python/i.test(await readFile(requirementsFile, "utf8"))
    ) {
      const probe = await runModelProbe(
        python,
        { action: "runtime" },
        LLAMA_PROBE_TIMEOUT_MS,
        signal
      );
      const gpuExpected =
        Number(probe.details?.cudaDriverVersion) > 0 ||
        probe.details?.metal === true;
      if (
        gpuExpected &&
        probe.details?.llamaGpu !== true &&
        !(await allowsCpuTextInstall())
      ) {
        signal?.throwIfAborted();
        const repaired = await repairLlamaRuntime(python, signal);
        log(`llama.cpp GPU verification: ${JSON.stringify(repaired)}`);
        if (repaired.status !== "success")
          throw new Error(
            `llama.cpp GPU runtime is unavailable: ${repaired.message}`
          );
      } else if (
        probe.status !== "success" ||
        typeof probe.details?.llamaGpu !== "boolean" ||
        probe.details?.llamaError
      )
        throw new Error(
          `llama.cpp could not initialize in ComfyUI's Python: ${JSON.stringify(probe.details ?? probe)}`
        );
    }
    return "installed";
  }
  const lastLines = output
    .trim()
    .split(/\r?\n/)
    .slice(-PIP_ERROR_TAIL_LINES)
    .join("\n");
  throw new Error(
    `Installing the dependencies of ${path.basename(nodePackDirectory)} failed:\n${lastLines}`
  );
};
