import { stat } from "node:fs/promises";
import path from "node:path";

import {
  runPythonProcess,
  type PythonProcessRunner
} from "./installNodePackRequirements";

const pythonInEnvironment = (environmentDirectory: string) =>
  process.platform === "win32"
    ? path.join(environmentDirectory, "Scripts", "python.exe")
    : path.join(environmentDirectory, "bin", "python");

export const comfyPythonCandidates = (comfyDirectory: string): string[] => {
  const installDirectory = path.dirname(comfyDirectory);
  return [
    path.join(installDirectory, "python_embeded", "python.exe"),
    pythonInEnvironment(path.join(comfyDirectory, "venv")),
    pythonInEnvironment(path.join(comfyDirectory, ".venv")),
    pythonInEnvironment(path.join(installDirectory, "venv")),
    pythonInEnvironment(path.join(installDirectory, ".venv"))
  ];
};

const versionNumberOf = (text: string): string | null =>
  /(\d+\.\d+\.\d+)/.exec(text)?.[1] ?? null;

export const findComfyPython = async ({
  comfyDirectory,
  reportedPythonVersion,
  runPython = runPythonProcess
}: {
  comfyDirectory: string;
  reportedPythonVersion: string | null;
  runPython?: PythonProcessRunner;
}): Promise<string | null> => {
  const comfyPythonVersion = versionNumberOf(reportedPythonVersion ?? "");
  if (!comfyPythonVersion) return null;
  for (const candidate of comfyPythonCandidates(comfyDirectory)) {
    const isFile = await stat(candidate)
      .then((info) => info.isFile())
      .catch(() => false);
    if (!isFile) continue;
    const { exitCode, output } = await runPython(candidate, [
      "--version"
    ]).catch(() => ({ exitCode: null, output: "" }));
    if (exitCode === 0 && versionNumberOf(output) === comfyPythonVersion)
      return candidate;
  }
  return null;
};
