import type { ScriptSetupRequirement } from "./contracts";

export type LocalModelType =
  | "text"
  | "minimax"
  | "qwen-image"
  | "qwen-edit"
  | "flux";
export type ModelComponent =
  | "main"
  | "encoder"
  | "vae"
  | "videoVae"
  | "audioVae"
  | "accelerator"
  | "lora";
export type ModelRuntime = "llama" | "comfy";
export interface ModelComponentDefinition {
  role: ModelComponent;
  filename: string;
  category: string;
  loader: string;
  input: string;
  clipType?: string;
  workflowFilenames?: string[];
  downloadUrl?: string;
}
export interface ModelVariantDefinition {
  id: string;
  label: string;
  bundleIds: string[];
  components: ModelComponentDefinition[];
  steps?: number;
}
export interface LocalModelDefinition {
  id: LocalModelType;
  label: string;
  runtime: ModelRuntime;
  wizardGroup: string | null;
  defaultVariant: string;
  supportsTiledDecode: boolean;
  variants: ModelVariantDefinition[];
}
export interface TextLoadSettings {
  mode: "auto" | "custom" | "all" | "cpu";
  gpuLayers: number;
  context: number;
  batch: number;
  offloadCache: boolean;
  memoryMap: boolean;
}
export interface ModelPreferences {
  variant: string;
  bindings: Record<string, string>;
  encoderDevice: "default" | "cpu";
  tiledDecode: boolean;
  text: TextLoadSettings;
}
export interface EndpointModelSettings {
  models: Partial<Record<LocalModelType, ModelPreferences>>;
  memoryPolicy: "auto" | "low-vram";
}
export interface ModelOperationResult {
  status: "success" | "mismatch" | "unsupported" | "unknown" | "error";
  message: string;
  details?: Record<string, unknown>;
}
export type ModelFileLoadTestOutcome = "passed" | "failed" | "untested";
export type ModelFileCheckKind = "compatibility" | "load" | "hash";
export interface ModelFileCheckSummary {
  kind: ModelFileCheckKind;
  outcome: "passed" | "failed" | "inconclusive";
  checkedAt: string;
}
export interface ModelFileChoice {
  filename: string;
  path: string | null;
  hasPassedModelCheck: boolean;
  loadTestOutcome: ModelFileLoadTestOutcome;
  missingNodes: ScriptSetupRequirement[];
  latestFileCheck: ModelFileCheckSummary | null;
  sourceUrl: string | null;
  expectedSha256: string | null;
  actualSha256: string | null;
}
export interface RecommendedModelFile {
  filename: string;
  isInstalled: boolean;
  setupDownloadName: string | null;
  sourceUrl: string | null;
}
export interface ModelSettingsSnapshot {
  endpoint: string;
  settings: EndpointModelSettings;
  setupTextVariant: string;
  model: LocalModelType;
  variant: string;
  components: Array<
    ModelComponentDefinition & {
      selectedFile: string;
      choices: ModelFileChoice[];
      recommendedFile: RecommendedModelFile;
      path: string | null;
      sourceUrl: string | null;
      expectedSha256: string | null;
      actualSha256: string | null;
      status: "installed" | "missing" | "unknown";
      problem: ModelOperationResult | null;
    }
  >;
  available: boolean;
  comfyVersion: string | null;
  local: boolean;
  python: string | null;
  managed: boolean;
  capabilities: { encoderCpu: boolean; tiledDecode: boolean };
  loadersAvailable: boolean;
  missingWorkflowNodes: ScriptSetupRequirement[];
  isLlamaCppPackageInstalled: boolean | null;
}
export type ModelSettingsRequest = {
  model: LocalModelType;
  endpoint?: string;
};
export type ModelSettingsMutation = ModelSettingsRequest & {
  preferences: ModelPreferences;
  memoryPolicy: "auto" | "low-vram";
};
export type ModelCheckRequest = ModelSettingsRequest & {
  role?: ModelComponent;
  filename?: string;
  action: "compatibility" | "hash" | "runtime" | "load" | "repair";
};
export interface ModelSettingsApi {
  inspect: (request: ModelSettingsRequest) => Promise<ModelSettingsSnapshot>;
  save: (request: ModelSettingsMutation) => Promise<ModelSettingsSnapshot>;
  check: (request: ModelCheckRequest) => Promise<ModelOperationResult>;
  diagnostics: (endpoint?: string) => Promise<Record<string, unknown>>;
}
