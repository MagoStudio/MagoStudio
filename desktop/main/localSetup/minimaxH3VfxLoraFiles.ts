import { LOCAL_MODEL_BUNDLES } from "../../shared/localModelManifest";

import type { ModelFile } from "./probeScriptSetup";

export const MINIMAX_H3_VFX_LORA_BUNDLE_ID = "minimax-h3-vfx-loras";

export const MINIMAX_H3_VFX_LORA_FILES: ModelFile[] = (
  LOCAL_MODEL_BUNDLES.find(
    (bundle) => bundle.id === MINIMAX_H3_VFX_LORA_BUNDLE_ID
  )?.files ?? []
).map((file) => ({
  name: file.targetPath.split("/").at(-1) ?? file.targetPath,
  node: "LoraLoaderModelOnly",
  input: "lora_name",
  folder: "loras",
  url: file.url,
  sha256: file.sha256
}));
