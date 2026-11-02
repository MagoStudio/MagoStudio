import { readFile, stat } from "node:fs/promises";
import path from "node:path";

import {
  COMFY_STARTER_BUNDLE,
  LOCAL_MODEL_BUNDLES,
  requiredBundles
} from "../../shared/localModelManifest";
import { ComfyQwenClient } from "../imageRenders/comfyQwenClient";
import { resolveAppFolder } from "../resolveAppFolder";

export const detectPriorSetup = async (settings: {
  localModelsRoot?: string;
  comfyEndpoint?: string;
  inferredComfyInstall?: { endpoint: string; directory: string };
}): Promise<boolean> => {
  if (settings.localModelsRoot) {
    const base = resolveAppFolder(settings.localModelsRoot);
    const engine = path.join(base, "ComfyUI_windows_portable");
    try {
      const marker = JSON.parse(
        await readFile(
          path.join(base, ".downloads", "engine-installed.json"),
          "utf8"
        )
      );
      const engineFiles = await Promise.all(
        ["python_embeded/python.exe", "ComfyUI/main.py"].map((file) =>
          stat(path.join(engine, file))
        )
      );
      const models = await Promise.all(
        requiredBundles(LOCAL_MODEL_BUNDLES)
          .flatMap((bundle) => bundle.files)
          .map(async (file) => {
            const info = await stat(
              path.join(engine, "ComfyUI", file.targetPath)
            );
            return info.isFile() && info.size === file.bytes;
          })
      );
      if (
        marker.sha256 === COMFY_STARTER_BUNDLE.sha256 &&
        engineFiles.every((file) => file.isFile()) &&
        models.every(Boolean)
      )
        return true;
    } catch {
      /* Missing or incomplete installer files. */
    }
  }
  // Only check a previously configured endpoint, not the default on fresh installs.
  const endpoint =
    settings.comfyEndpoint ?? settings.inferredComfyInstall?.endpoint;
  if (endpoint) {
    try {
      await new ComfyQwenClient(endpoint).validate();
      return true;
    } catch {
      /* Existing endpoint is unavailable. */
    }
  }
  return false;
};
