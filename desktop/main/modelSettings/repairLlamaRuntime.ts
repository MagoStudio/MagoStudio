import { repairGpuRuntime } from "./repairGpuRuntime";

export const repairLlamaRuntime = (python: string, signal?: AbortSignal) =>
  repairGpuRuntime(python, "llama", signal);
