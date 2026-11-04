/* oxlint-disable eslint/no-magic-numbers -- graph dimensions are probe placeholders */
import type {
  ComfySettings,
  ScriptSetupRequirement,
  ScriptSetupStatus
} from "../../shared/contracts";
import { pikaH3FlexTurboLoraUrl } from "../../shared/localModelManifest";
import {
  MINIMAX_H3_DRAFT_STEPS,
  MINIMAX_H3_HD_STEPS,
  MINIMAX_H3_STEP_LORAS,
  MINIMAX_H3_TURBO_STEPS,
  type MiniMaxH3StepLoraSteps
} from "../../shared/minimaxH3StepLoras";
import { REQUIRED_COMFYUI_VERSION } from "../../shared/requiredComfyVersion";
import { asRecord } from "../comfy/asRecord";
import { ComfyClient } from "../comfy/ComfyClient";
import {
  buildMiniMaxH3Graph,
  LOCAL_SCRIPT_MODEL_FILES as files
} from "../scriptProjects/comfyScriptProjectClient";

import { applyRequiredComfyVersion } from "./applyRequiredComfyVersion";
import { MINIMAX_H3_VFX_LORA_FILES } from "./minimaxH3VfxLoraFiles";
import { optionalScriptSetups } from "./optionalScriptSetups";
import { addSetupDestinations } from "./setupDestinations";

const defaultSettings = {
  vlmBackend: "qwen3-vl-2b-gguf",
  scriptTextModel: "qwen38-27b-q5"
} as const;
type SetupSettings = Pick<ComfySettings, "vlmBackend" | "scriptTextModel">;

const CORE_URL = "https://github.com/Comfy-Org/ComfyUI";
const NODE_URLS: Record<string, string> = {
  UnetLoaderGGUF: "https://github.com/city96/ComfyUI-GGUF",
  MagoQwen3VLLoader: "https://github.com/MagoStudio/ComfyUI-MagoNodes",
  MagoQwen3VLCaption: "https://github.com/MagoStudio/ComfyUI-MagoNodes",
  SimpleQwenVLggufV2: "https://github.com/KLL535/ComfyUI_Simple_Qwen3-VL-gguf",
  MiniMaxChunkFeedForward: "https://github.com/kijai/ComfyUI-KJNodes",
  VHS_LoadVideo: "https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite"
};
const MODEL_ROOT = "https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main";
export type ModelFile = {
  alternatives?: readonly string[];
  name: string;
  node: string;
  input: string;
  folder: string;
  url?: string;
  sha256?: string;
};
const stepLoraFile = (steps: MiniMaxH3StepLoraSteps): ModelFile => ({
  name: MINIMAX_H3_STEP_LORAS[steps].loraFile,
  node: "LoraLoaderModelOnly",
  input: "lora_name",
  folder: "loras",
  url: pikaH3FlexTurboLoraUrl(MINIMAX_H3_STEP_LORAS[steps].loraFile),
  sha256: MINIMAX_H3_STEP_LORAS[steps].loraFileSha256
});
const modelFiles: ModelFile[] = [
  {
    name: files.videoUnet,
    node: "UNETLoader",
    input: "unet_name",
    folder: "diffusion_models"
  },
  {
    name: files.videoClipVanilla,
    node: "CLIPLoader",
    input: "clip_name",
    folder: "text_encoders"
  },
  { name: files.videoVae, node: "VAELoader", input: "vae_name", folder: "vae" },
  { name: files.audioVae, node: "VAELoader", input: "vae_name", folder: "vae" },
  stepLoraFile(MINIMAX_H3_HD_STEPS)
];
const optionalStepLoraFiles: ModelFile[] = [
  stepLoraFile(MINIMAX_H3_DRAFT_STEPS),
  stepLoraFile(MINIMAX_H3_TURBO_STEPS)
];

const nodeNames = () => [
  ...new Set([
    ...Object.values(
      buildMiniMaxH3Graph({
        prompt: "",
        width: 512,
        height: 512,
        length: 124,
        steps: MINIMAX_H3_HD_STEPS,
        noiseSeed: 0,
        referenceInputs: {}
      })
    ).map((node) => node.class_type),
    "LoadImage",
    "VHS_LoadVideo"
  ])
];

const choices = (node: Record<string, unknown>, name: string): string[] => {
  const input = asRecord(node.input);
  for (const group of ["required", "optional"]) {
    const definition = asRecord(input?.[group])?.[name];
    if (!Array.isArray(definition)) continue;
    const options = Array.isArray(definition[0])
      ? definition[0]
      : asRecord(definition[1])?.options;
    if (Array.isArray(options))
      return options.filter(
        (value): value is string => typeof value === "string"
      );
  }
  return [];
};
const basename = (name: string) => name.split(/[\\/]/).at(-1)?.toLowerCase();

export const evaluateScriptSetup = (
  info: Record<string, unknown>,
  settings: SetupSettings = defaultSettings
): ScriptSetupStatus => {
  const nodeRequirement = (name: string): ScriptSetupRequirement => ({
    name,
    url: NODE_URLS[name] ?? CORE_URL,
    status: asRecord(info[name])?.probeError
      ? "unknown"
      : asRecord(info[name])
        ? "installed"
        : "missing"
  });
  const modelRequirement = (
    file: (typeof modelFiles)[number]
  ): ScriptSetupRequirement => {
    const node = asRecord(info[file.node]);
    return {
      name: file.name,
      folder: `models/${file.folder}/`,
      url: file.url ?? `${MODEL_ROOT}/${file.folder}/${file.name}`,
      ...(file.sha256 ? { downloadSha256: file.sha256 } : {}),
      status:
        !node || node.probeError
          ? "unknown"
          : choices(node, file.input).some((name) =>
                [file.name, ...(file.alternatives ?? [])].some(
                  (wanted) => basename(name) === basename(wanted)
                )
              )
            ? "installed"
            : "missing"
    };
  };
  const nodes = nodeNames().map(nodeRequirement);
  const models = modelFiles.map(modelRequirement);
  return {
    ready: [...nodes, ...models].every((item) => item.status === "installed"),
    nodes,
    models,
    optional: optionalScriptSetups(settings).map((group) => ({
      id: group.id,
      title: group.title,
      requirements: [
        ...group.nodes.map(nodeRequirement),
        ...group.files.map(modelRequirement)
      ]
    })),
    optionalStepLoras: optionalStepLoraFiles.map(modelRequirement),
    vfxLoras: MINIMAX_H3_VFX_LORA_FILES.map(modelRequirement)
  };
};

export const probeScriptSetup = async (
  endpoint: string,
  settings: SetupSettings = defaultSettings
): Promise<ScriptSetupStatus> => {
  const client = new ComfyClient(endpoint);
  const names = nodeNames();
  const entries = await Promise.all(
    names.map(async (name) => {
      const info = await client.getJson(
        `/object_info/${encodeURIComponent(name)}`
      );
      return [name, info[name]] as const;
    })
  );
  const info: Record<string, unknown> = Object.fromEntries(entries);
  const optionalNames = [
    ...new Set(
      optionalScriptSetups(settings).flatMap((group) => [
        ...group.nodes,
        ...group.files.map((file) => file.node)
      ])
    )
  ].filter((name) => !names.includes(name) && name !== "scriptTextInventory");
  await Promise.all(
    optionalNames.map(async (name) => {
      try {
        const result = await client.getJson(
          "/object_info/" + encodeURIComponent(name)
        );
        info[name] = result[name];
      } catch {
        info[name] = { probeError: true };
      }
    })
  );
  const [stats, inventory] = await Promise.all([
    client.getJson("/system_stats").catch(() => null),
    client
      .request("/experiment/models", { method: "GET" })
      .then((response) => response.json())
      .catch(() => null)
  ]);
  try {
    const [fileResponse, folderResponse] = await Promise.all([
      client.request("/models/clip_gguf", { method: "GET" }),
      client.request("/experiment/models", { method: "GET" })
    ]);
    const available = await fileResponse.json();
    const folders = await folderResponse.json();
    const folder = Array.isArray(folders)
      ? folders.find((item) => asRecord(item)?.name === "clip_gguf")
      : null;
    const paths = asRecord(folder)?.folders;
    if (
      !Array.isArray(available) ||
      !Array.isArray(paths) ||
      !paths.some((path) => typeof path === "string" && path.length)
    )
      throw new Error("Model inventory unavailable");
    info.scriptTextInventory = { input: { required: { model: [available] } } };
  } catch {
    info.scriptTextInventory = { probeError: true };
  }
  return addSetupDestinations(
    applyRequiredComfyVersion(
      evaluateScriptSetup(info, settings),
      stats,
      REQUIRED_COMFYUI_VERSION
    ),
    stats,
    inventory
  );
};
