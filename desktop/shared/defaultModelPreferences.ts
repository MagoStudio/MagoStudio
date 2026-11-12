import type { ModelPreferences } from "./modelSettings";

export const defaultModelPreferences = (variant: string): ModelPreferences => ({
  variant,
  bindings: {},
  encoderDevice: "default",
  tiledDecode: false,
  text: {
    mode: "auto",
    gpuLayers: 24,
    context: 32768,
    batch: 2048,
    offloadCache: true,
    memoryMap: true
  }
});
