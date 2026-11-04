import path from "node:path";

import { asRecord } from "../comfy/asRecord";
import { normalizeComfyEndpoint } from "../comfy/normalizeComfyEndpoint";

import type { ModelGroupItem } from "./listModelGroupItems";

const REQUEST_TIMEOUT_MS = 5_000;

const NODE_PACK_NODES: Record<string, string[]> = {
  "comfyui-kjnodes": ["MiniMaxChunkFeedForward"],
  "comfyui-videohelpersuite": ["VHS_LoadVideo"],
  "comfyui-gguf": ["UnetLoaderGGUF"],
  "comfyui_simple_qwen3-vl-gguf": ["SimpleQwenVLggufV2"]
};

const MODEL_LOADERS: Record<string, [string, string]> = {
  diffusion_models: ["UNETLoader", "unet_name"],
  unet: ["UnetLoaderGGUF", "unet_name"],
  text_encoders: ["CLIPLoader", "clip_name"],
  vae: ["VAELoader", "vae_name"],
  latent_upscale_models: ["LatentUpscaleModelLoader", "model_name"],
  loras: ["LoraLoaderModelOnly", "lora_name"]
};

const basename = (name: string): string =>
  name.split(/[\\/]/).at(-1)!.toLowerCase();

const comboChoices = (node: unknown, inputName: string): string[] => {
  const input = asRecord(asRecord(node)?.input);
  for (const group of ["required", "optional"]) {
    const definition = asRecord(input?.[group])?.[inputName];
    if (!Array.isArray(definition)) continue;
    const options = Array.isArray(definition[0])
      ? definition[0]
      : asRecord(definition[1])?.options;
    if (Array.isArray(options))
      return options.filter(
        (option): option is string => typeof option === "string"
      );
  }
  return [];
};

export type RunningComfyAvailability = (item: ModelGroupItem) => boolean;

// Availability belongs to the configured server. Item paths remain installation
// destinations, and runtime observations must never become managed-install hashes.
export const readRunningComfyAvailability = async (
  endpoint: string
): Promise<RunningComfyAvailability | null> => {
  try {
    const normalized = normalizeComfyEndpoint(endpoint);
    const getJson = async (route: string): Promise<unknown> => {
      const response = await fetch(`${normalized}${route}`, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
      });
      if (!response.ok)
        throw new Error(
          `ComfyUI inventory request failed (${response.status})`
        );
      return response.json();
    };
    const nodeNames = [
      ...new Set([
        ...Object.values(NODE_PACK_NODES).flat(),
        ...Object.values(MODEL_LOADERS).map(([node]) => node)
      ])
    ];
    const [entries, ggufFiles] = await Promise.all([
      Promise.all(
        nodeNames.map(async (name) => {
          const info = asRecord(
            await getJson(`/object_info/${encodeURIComponent(name)}`)
          );
          if (!info) throw new Error("Invalid ComfyUI node inventory");
          return [name, info[name]] as const;
        })
      ),
      getJson("/models/clip_gguf").catch(() => [])
    ]);
    const nodes = Object.fromEntries(entries);
    const textModels = new Set(
      Array.isArray(ggufFiles)
        ? ggufFiles
            .filter((file): file is string => typeof file === "string")
            .map(basename)
        : []
    );
    return (item) => {
      if (item.kind === "node-pack") {
        const requiredNodes = NODE_PACK_NODES[item.name.toLowerCase()];
        return (
          requiredNodes !== undefined &&
          requiredNodes.every((name) => !!asRecord(nodes[name]))
        );
      }
      if (
        item.name.toLowerCase().endsWith(".gguf") &&
        path.basename(path.dirname(item.absolutePath)) === "text_encoders"
      )
        return textModels.has(basename(item.name));
      const loader =
        MODEL_LOADERS[path.basename(path.dirname(item.absolutePath))];
      return (
        loader !== undefined &&
        comboChoices(nodes[loader[0]], loader[1]).some(
          (name) => basename(name) === basename(item.name)
        )
      );
    };
  } catch {
    return null;
  }
};
