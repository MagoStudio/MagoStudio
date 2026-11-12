import path from "node:path";

import type {
  ScriptSetupRequirement,
  ScriptSetupStatus
} from "../../shared/contracts";
import { LOCAL_NODE_PACK_PINS } from "../../shared/localNodePackPins";
import { asRecord } from "../comfy/asRecord";

const pathApi = (value: string) =>
  /^[a-z]:[\\/]|^\\\\/i.test(value) ? path.win32 : path.posix;
const absolute = (value: unknown): value is string =>
  typeof value === "string" && pathApi(value).isAbsolute(value);

export const inferSetupFolders = (stats: unknown, inventory: unknown) => {
  const categories: Record<string, string[]> = {};
  if (Array.isArray(inventory))
    for (const entry of inventory) {
      const item = asRecord(entry);
      if (typeof item?.name === "string" && Array.isArray(item.folders))
        categories[item.name] = item.folders.filter(absolute);
    }
  const argv = asRecord(asRecord(stats)?.system)?.argv;
  const script = Array.isArray(argv) ? argv[0] : undefined;
  let root =
    absolute(script) && /[\\/]main\.py$/i.test(script)
      ? pathApi(script).dirname(script)
      : undefined;
  // Only infer a root from the conventional ComfyUI/models layout. External
  // model stores do not identify the installation directory.
  if (!root)
    for (const folder of Object.values(categories).flat()) {
      const match = folder.match(/^(.*[\\/]ComfyUI)[\\/]models(?:[\\/]|$)/i);
      if (match) {
        root = match[1];
        break;
      }
    }
  return { root, categories };
};

export const addSetupDestinations = (
  status: ScriptSetupStatus,
  stats: unknown,
  inventory: unknown
): ScriptSetupStatus => {
  const { root, categories } = inferSetupFolders(stats, inventory);
  const map = (item: ScriptSetupRequirement): ScriptSetupRequirement => {
    if (!item.folder) {
      if (
        item.name === "MagoQwen3VLLoader" ||
        item.name === "MagoQwen3VLCaption"
      )
        return {
          ...item,
          installKind: "node",
          installNote:
            "These 2B captioning nodes are not included in the pinned bundle. Select Qwen3-VL 4B Heretic in Settings to use the supported native captioning path."
        };
      if (item.url === "https://github.com/Comfy-Org/ComfyUI")
        return { ...item, installKind: "core" };
      return {
        ...item,
        installKind: "node",
        folder: root
          ? pathApi(root).join(root, "custom_nodes")
          : "<ComfyUI>/custom_nodes",
        downloadUrl: LOCAL_NODE_PACK_PINS[item.url]?.url,
        downloadSha256: LOCAL_NODE_PACK_PINS[item.url]?.sha256,
        archiveStripRoot: LOCAL_NODE_PACK_PINS[item.url]?.stripRoot,
        pinnedRevision: LOCAL_NODE_PACK_PINS[item.url]?.revision
      };
    }
    const relative = item.folder.replace(/^models\//, "").replace(/\/$/, "");
    const aliases: Record<string, string[]> = {
      diffusion_models: ["diffusion_models", "unet"],
      unet: ["unet", "diffusion_models"],
      text_encoders: ["text_encoders", "clip", "clip_gguf"],
      "LLM/GGUF": ["LLM"]
    };
    let folder = (aliases[relative] ?? [relative]).flatMap(
      (key) => categories[key] ?? []
    )[0];
    if (folder && relative === "LLM/GGUF")
      folder = pathApi(folder).join(folder, "GGUF");
    folder ??= root
      ? pathApi(root).join(root, "models", relative)
      : `<ComfyUI>/models/${relative}`;
    const downloadUrl = !item.url
      ? undefined
      : item.url.includes("/resolve/")
        ? item.url
        : `${item.url.replace(/\/$/, "")}/resolve/main/${encodeURIComponent(item.name)}`;
    return { ...item, folder, installKind: "model", downloadUrl };
  };
  return {
    ...status,
    comfyRoot: root,
    nodes: status.nodes.map(map),
    models: status.models.map(map),
    highQuality: status.highQuality.map(map),
    vfxLoras: status.vfxLoras.map(map),
    optional: status.optional.map((group) => ({
      ...group,
      requirements: group.requirements.map(map)
    }))
  };
};
