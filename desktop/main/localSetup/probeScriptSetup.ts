import path from "node:path";

/* oxlint-disable eslint/no-magic-numbers -- 4 and 8 are the supported MiniMax step presets; graph dimensions are probe placeholders */
import type {
  ComfySettings,
  ScriptSetupRequirement,
  ScriptSetupStatus
} from "../../shared/contracts";
import { REQUIRED_COMFYUI_VERSION } from "../../shared/requiredComfyVersion";
import { asRecord } from "../comfy/asRecord";
import { ComfyClient } from "../comfy/ComfyClient";
import { readConfiguredTextModelPath } from "../modelSettings/modelRuntimeHooks";
import { prepareSetupModelFiles } from "../modelSettings/prepareSetupModelFiles";
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
const PDD_URL = "https://github.com/Jalen-Brunson/ComfyUI-MiniMax-H3-PDD-Acc";
const NODE_URLS: Record<string, string> = {
  UnetLoaderGGUF: "https://github.com/city96/ComfyUI-GGUF",
  MagoQwen3VLLoader: "https://github.com/MagoStudio/ComfyUI-MagoNodes",
  MagoQwen3VLCaption: "https://github.com/MagoStudio/ComfyUI-MagoNodes",
  SimpleQwenVLggufV2: "https://github.com/KLL535/ComfyUI_Simple_Qwen3-VL-gguf",
  MiniMaxChunkFeedForward: "https://github.com/kijai/ComfyUI-KJNodes",
  VHS_LoadVideo: "https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite",
  MiniMaxH3PDDAccApply: PDD_URL
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
  {
    name: files.videoLora4,
    node: "LoraLoaderModelOnly",
    input: "lora_name",
    folder: "loras"
  }
];
const highQualityFile = {
  name: files.videoPdd8,
  node: "MiniMaxH3PDDAccApply",
  input: "pdd_file",
  folder: "pdd_acc",
  url: `https://huggingface.co/alibaba-pai/MiniMax-H3-Acc-LoRAs/resolve/main/${files.videoPdd8}`
};

const nodeNames = (steps: 4 | 8) => [
  ...new Set([
    ...Object.values(
      buildMiniMaxH3Graph({
        prompt: "",
        width: 512,
        height: 512,
        length: 124,
        steps,
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
  settings: SetupSettings = defaultSettings,
  templates = {
    models: modelFiles,
    nodes: nodeNames(4),
    optional: optionalScriptSetups(settings),
    highQualityFiles: [highQualityFile] as ModelFile[],
    highQualityNodes: nodeNames(8).filter(
      (name) => !nodeNames(4).includes(name)
    )
  }
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
  const nodes = templates.nodes.map(nodeRequirement);
  const models = templates.models.map(modelRequirement);
  return {
    ready: [...nodes, ...models].every((item) => item.status === "installed"),
    nodes,
    models,
    optional: templates.optional.map((group) => ({
      id: group.id,
      title: group.title,
      requirements: [
        ...group.nodes.map(nodeRequirement),
        ...group.files.map(modelRequirement)
      ]
    })),
    highQuality: [
      ...templates.highQualityNodes.map(nodeRequirement),
      ...templates.highQualityFiles.map(modelRequirement)
    ],
    vfxLoras: MINIMAX_H3_VFX_LORA_FILES.map(modelRequirement)
  };
};

export const probeScriptSetup = async (
  endpoint: string,
  settings: SetupSettings = defaultSettings
): Promise<ScriptSetupStatus> => {
  const client = new ComfyClient(endpoint);
  const [core, high, optional] = await Promise.all([
    prepareSetupModelFiles(endpoint, modelFiles, nodeNames(4)),
    prepareSetupModelFiles(
      endpoint,
      [...modelFiles, highQualityFile],
      nodeNames(8)
    ),
    Promise.all(
      optionalScriptSetups(settings).map(async (group) => ({
        ...group,
        ...(await prepareSetupModelFiles(endpoint, group.files, group.nodes))
      }))
    )
  ]);
  let customText: string | null = null;
  let textError = false;
  try {
    customText = await readConfiguredTextModelPath(endpoint);
  } catch {
    textError = true;
  }
  if (customText) {
    const text = optional.find((group) => group.id === "script-text")!;
    text.files = text.files.map((file) => ({
      ...file,
      name: path.basename(customText!),
      url: "",
      sha256: undefined
    }));
  }
  const names = [...new Set([...core.nodes, ...high.nodes])];
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
      optional.flatMap((group) => [
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
  if (customText)
    info.scriptTextInventory = {
      input: { required: { model: [[path.basename(customText)]] } }
    };
  if (textError) info.scriptTextInventory = { probeError: true };
  const result = addSetupDestinations(
    applyRequiredComfyVersion(
      evaluateScriptSetup(info, settings, {
        models: core.files,
        nodes: core.nodes,
        optional,
        highQualityFiles: high.files.slice(modelFiles.length),
        highQualityNodes: high.nodes.filter(
          (name) => !core.nodes.includes(name)
        )
      }),
      stats,
      REQUIRED_COMFYUI_VERSION
    ),
    stats,
    inventory
  );
  if (customText) {
    for (const requirement of result.optional.find(
      (group) => group.id === "script-text"
    )!.requirements)
      if (requirement.folder) requirement.folder = path.dirname(customText);
  }
  return result;
};
