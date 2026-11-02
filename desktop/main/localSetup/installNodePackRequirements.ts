import { spawn } from "node:child_process";
import { stat } from "node:fs/promises";
import path from "node:path";

export type PythonProcessRunner = (
  python: string,
  args: string[],
  signal?: AbortSignal
) => Promise<{ exitCode: number | null; output: string }>;

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
  if (exitCode === 0) return "installed";
  const lastLines = output
    .trim()
    .split(/\r?\n/)
    .slice(-PIP_ERROR_TAIL_LINES)
    .join("\n");
  throw new Error(
    `Installing the dependencies of ${path.basename(nodePackDirectory)} failed:\n${lastLines}`
  );
};
