import type { ModelOperationResult } from "../../shared/modelSettings";
import { runPythonProcess } from "../localSetup/installNodePackRequirements";

import { MODEL_PROBE_SCRIPT } from "./modelProbeScript";

const MODEL_ERROR_TAIL = 16000;
const MODEL_LOAD_TIMEOUT_MS = 600_000;

export const runModelProbe = async (
  python: string,
  request: Record<string, unknown>,
  timeout = MODEL_LOAD_TIMEOUT_MS,
  signal?: AbortSignal
): Promise<ModelOperationResult> => {
  signal?.throwIfAborted();
  const { output, exitCode } = await runPythonProcess(
    python,
    ["-s", "-c", MODEL_PROBE_SCRIPT, JSON.stringify(request)],
    AbortSignal.any([AbortSignal.timeout(timeout), ...(signal ? [signal] : [])])
  );
  const result = /MAGO_MODEL_RESULT=(.+)/.exec(output)?.[1];
  if (!result)
    return {
      status: "error",
      message: `Model probe exited ${exitCode ?? "without a status"}`,
      details: { output: output.slice(-MODEL_ERROR_TAIL) }
    };
  return JSON.parse(result) as ModelOperationResult;
};
