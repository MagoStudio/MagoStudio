import { runPythonProcess } from "../localSetup/installNodePackRequirements";

const PACKAGE_LOOKUP_TIMEOUT_MS = 15_000;

export const readLlamaCppPackageInstalled = async (
  python: string
): Promise<boolean | null> => {
  try {
    const lookup = await runPythonProcess(
      python,
      [
        "-s",
        "-c",
        "import importlib.metadata as metadata; metadata.version('llama-cpp-python')"
      ],
      AbortSignal.timeout(PACKAGE_LOOKUP_TIMEOUT_MS)
    );
    return lookup.exitCode === 0;
  } catch {
    return null;
  }
};
