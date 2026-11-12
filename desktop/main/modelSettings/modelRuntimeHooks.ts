import type { ComfyGraph } from "../comfy/comfyGraph";

type ModelRuntimeHooks = {
  prepare: (endpoint: string, graph: ComfyGraph) => Promise<ComfyGraph>;
  observe: (endpoint: string, stats: Record<string, unknown>) => Promise<void>;
  memoryPolicy: (endpoint: string) => Promise<"auto" | "low-vram">;
  textModelPath: (endpoint: string) => Promise<string | null>;
  allowsCpuTextInstall: () => Promise<boolean>;
  failed: (
    endpoint: string,
    message: string,
    graph: ComfyGraph
  ) => Promise<void>;
};
let hooks: ModelRuntimeHooks | null = null;
export const configureModelRuntimeHooks = (value: ModelRuntimeHooks | null) => {
  hooks = value;
};
export const prepareModelGraph = (
  endpoint: string,
  graph: ComfyGraph
): Promise<ComfyGraph> =>
  hooks ? hooks.prepare(endpoint, graph) : Promise.resolve(graph);
export const observeModelHost = (
  endpoint: string,
  stats: Record<string, unknown>
): Promise<void> =>
  hooks ? hooks.observe(endpoint, stats) : Promise.resolve();
export const readModelMemoryPolicy = (
  endpoint: string
): Promise<"auto" | "low-vram"> =>
  hooks ? hooks.memoryPolicy(endpoint) : Promise.resolve("auto");
export const readConfiguredTextModelPath = (
  endpoint: string
): Promise<string | null> =>
  hooks ? hooks.textModelPath(endpoint) : Promise.resolve(null);
export const allowsCpuTextInstall = (): Promise<boolean> =>
  hooks ? hooks.allowsCpuTextInstall() : Promise.resolve(false);
export const recordModelFailure = (
  endpoint: string,
  message: string,
  graph: ComfyGraph
): Promise<void> =>
  hooks ? hooks.failed(endpoint, message, graph) : Promise.resolve();
