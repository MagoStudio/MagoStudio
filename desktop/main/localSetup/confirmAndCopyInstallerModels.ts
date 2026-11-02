import path from "node:path";

import { copyModelsToRunningComfy } from "./copyModelsToRunningComfy";
import type { ModelGroupItem } from "./listModelGroupItems";

export const MANUAL_COMFY_MODEL_COPY_MESSAGE =
  "The model files are downloaded to the installation folder by default. Your current ComfyUI server folder cannot be accessed, please copy the files there manually.";
const BYTES_PER_GB = 1_000_000_000;

export const modelCopyConfirmationMessage = (bytes: number): string =>
  `The ComfyUI URL provided is not from the MagoStudio-provided ComfyUI-bundle. The model files are downloaded to the installation folder by default. Copy the model files to your currently running ComfyUI models folder? This will use ${(bytes / BYTES_PER_GB).toFixed(1)} GB of disk space.`;

export const confirmAndCopyInstallerModels = async ({
  endpoint,
  managedComfyDirectory,
  items,
  signal,
  confirmCopy,
  showCopyError,
  prepareCopy = copyModelsToRunningComfy
}: {
  endpoint: string;
  managedComfyDirectory: string;
  items: Extract<ModelGroupItem, { kind: "model-file" }>[];
  signal: AbortSignal;
  confirmCopy: (bytes: number) => Promise<boolean>;
  showCopyError: () => Promise<void>;
  prepareCopy?: typeof copyModelsToRunningComfy;
}): Promise<void> => {
  if (items.length === 0) return;
  const copy = await prepareCopy(endpoint);
  signal.throwIfAborted();
  if (!copy) {
    await showCopyError();
    return;
  }
  const normalize = (folder: string) =>
    process.platform === "win32"
      ? path.resolve(folder).toLowerCase()
      : path.resolve(folder);
  if (normalize(copy.comfyRoot) === normalize(managedComfyDirectory)) return;
  const uniqueItems = [
    ...new Map(items.map((item) => [item.absolutePath, item])).values()
  ];
  if (
    !(await confirmCopy(
      uniqueItems.reduce((bytes, item) => bytes + item.bytes, 0)
    ))
  )
    return;
  signal.throwIfAborted();
  try {
    for (const item of uniqueItems) await copy(item, signal);
  } catch (error) {
    if (signal.aborted) throw error;
    await showCopyError();
  }
};
