import { LOCAL_MODEL_BUNDLES } from "../../shared/localModelManifest";
import { MINIMAX_H3_CROSSVIEW_LORA_FILE } from "../../shared/minimaxH3VfxModes";
import { CROSSVIEW_DEPTH_MODEL_FILE } from "../comfy/buildCrossviewWarpNodes";

import type { ModelFile } from "./probeScriptSetup";

export const MINIMAX_H3_VFX_LORA_BUNDLE_ID = "minimax-h3-vfx-loras";

const NON_LORA_LOADER_BY_MODEL_FOLDER: Partial<
  Record<string, { node: string; input: string }>
> = {
  geometry_estimation: { node: "LoadMoGeModel", input: "model_name" }
};

const MODEL_FOLDER_AND_NAME_PATTERN = /([^/]+)\/([^/]+)$/;

export const MINIMAX_H3_VFX_LORA_FILES: ModelFile[] = (
  LOCAL_MODEL_BUNDLES.find(
    (bundle) => bundle.id === MINIMAX_H3_VFX_LORA_BUNDLE_ID
  )?.files ?? []
).map((file) => {
  const folderAndName = MODEL_FOLDER_AND_NAME_PATTERN.exec(file.targetPath);
  if (!folderAndName) throw new Error(`${file.targetPath} has no model folder`);
  const [, folder, name] = folderAndName;
  return {
    name,
    ...(NON_LORA_LOADER_BY_MODEL_FOLDER[folder] ?? {
      node: "LoraLoaderModelOnly",
      input: "lora_name"
    }),
    folder,
    url: file.url,
    sha256: file.sha256
  };
});

const findVfxLoraBundleFile = (name: string): ModelFile => {
  const file = MINIMAX_H3_VFX_LORA_FILES.find((entry) => entry.name === name);
  if (!file)
    throw new Error(`${name} is missing from ${MINIMAX_H3_VFX_LORA_BUNDLE_ID}`);
  return file;
};

export const MINIMAX_H3_CROSSVIEW_MODEL_FILES: ModelFile[] = [
  CROSSVIEW_DEPTH_MODEL_FILE,
  MINIMAX_H3_CROSSVIEW_LORA_FILE
].map(findVfxLoraBundleFile);
