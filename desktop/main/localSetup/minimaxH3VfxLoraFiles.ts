import {
  LOCAL_MODEL_BUNDLES,
  MINIMAX_H3_CROSSVIEW_BUNDLE_ID,
  MINIMAX_H3_VFX_LORA_BUNDLE_ID
} from "../../shared/localModelManifest";
import { MINIMAX_H3_CROSSVIEW_LORA_FILE } from "../../shared/minimaxH3VfxModes";
import { CROSSVIEW_DEPTH_MODEL_FILE } from "../comfy/buildCrossviewWarpNodes";

import type { ModelFile } from "./probeScriptSetup";

const NON_LORA_LOADER_BY_MODEL_FOLDER: Partial<
  Record<string, { node: string; input: string }>
> = {
  geometry_estimation: { node: "LoadMoGeModel", input: "model_name" }
};

const MODEL_FOLDER_AND_NAME_PATTERN = /([^/]+)\/([^/]+)$/;

const findBundle = (bundleId: string) => {
  const bundle = LOCAL_MODEL_BUNDLES.find(
    (candidate) => candidate.id === bundleId
  );
  if (!bundle) throw new Error(`Unknown model bundle: ${bundleId}`);
  return bundle;
};

const modelFilesOfBundle = (bundleId: string): ModelFile[] =>
  findBundle(bundleId).files.map((file) => {
    const folderAndName = MODEL_FOLDER_AND_NAME_PATTERN.exec(file.targetPath);
    if (!folderAndName)
      throw new Error(`${file.targetPath} has no model folder`);
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

export const MINIMAX_H3_VFX_LORA_FILES: ModelFile[] = modelFilesOfBundle(
  MINIMAX_H3_VFX_LORA_BUNDLE_ID
);

const crossviewBundleFiles = modelFilesOfBundle(MINIMAX_H3_CROSSVIEW_BUNDLE_ID);

const findCrossviewBundleFile = (name: string): ModelFile => {
  const file = crossviewBundleFiles.find((entry) => entry.name === name);
  if (!file)
    throw new Error(
      `${name} is missing from ${MINIMAX_H3_CROSSVIEW_BUNDLE_ID}`
    );
  return file;
};

export const MINIMAX_H3_CROSSVIEW_MODEL_FILES: ModelFile[] = [
  CROSSVIEW_DEPTH_MODEL_FILE,
  MINIMAX_H3_CROSSVIEW_LORA_FILE
].map(findCrossviewBundleFile);
