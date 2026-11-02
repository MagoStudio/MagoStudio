import type { StarterInstallStatus } from "../../../../../desktop/shared/contracts";
import {
  COMFY_STARTER_BUNDLE,
  LOCAL_MODEL_BUNDLES,
  requiredBundles
} from "../../../../../desktop/shared/localModelManifest";

const PREVIEW_INSTALL_DIRECTORY = "MagoStudio/ComfyUI_windows_portable";
const PREVIEW_DOWNLOAD_CACHE = "MagoStudio/.downloads";

export const buildStarterInstallPreview = (): StarterInstallStatus => {
  const comfyPartUrls = COMFY_STARTER_BUNDLE.partUrls;
  const isComfyBundleSingleZip = comfyPartUrls.length === 1;
  const comfyFiles = comfyPartUrls.map((url, partIndex) => ({
    name: isComfyBundleSingleZip
      ? "ComfyUI engine ZIP"
      : `ComfyUI bundle part ${partIndex + 1}`,
    url,
    bytes: COMFY_STARTER_BUNDLE.partBytes[partIndex],
    destination: isComfyBundleSingleZip
      ? `${PREVIEW_DOWNLOAD_CACHE}/comfy.zip`
      : `${PREVIEW_DOWNLOAD_CACHE}/comfy.zip.part${partIndex + 1}`
  }));
  const modelFiles = requiredBundles(LOCAL_MODEL_BUNDLES)
    .flatMap((bundle) => bundle.files)
    .map((file) => ({
      name: file.targetPath.split("/").pop() ?? file.targetPath,
      url: file.url,
      bytes: file.bytes,
      destination: `${PREVIEW_INSTALL_DIRECTORY}/ComfyUI/${file.targetPath}`
    }));

  return {
    phase: "idle",
    files: [...comfyFiles, ...modelFiles].map((file) => ({
      ...file,
      downloadedBytes: 0,
      state: "waiting" as const
    })),
    directory: PREVIEW_INSTALL_DIRECTORY,
    error: null
  };
};
