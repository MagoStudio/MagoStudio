import { copyFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";

import { normalizeComfyEndpoint } from "../comfy/normalizeComfyEndpoint";
import { atomicProduceFile } from "../storage/atomicFile";

import { hashFile } from "./hashFile";
import type { ModelGroupItem } from "./listModelGroupItems";
import { inferSetupFolders } from "./setupDestinations";

const REQUEST_TIMEOUT_MS = 5_000;
type ModelFileItem = Extract<ModelGroupItem, { kind: "model-file" }>;
export type CopyModelToRunningComfy = ((
  item: ModelFileItem,
  signal: AbortSignal
) => Promise<void>) & { comfyRoot: string };

export const copyModelsToRunningComfy = async (
  endpoint: string
): Promise<CopyModelToRunningComfy | null> => {
  let folders: ReturnType<typeof inferSetupFolders>;
  try {
    const normalized = normalizeComfyEndpoint(endpoint);
    if (
      !["localhost", "127.0.0.1", "[::1]"].includes(
        new URL(normalized).hostname
      )
    )
      return null;
    const read = async (route: string) => {
      const response = await fetch(`${normalized}${route}`, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
      });
      if (!response.ok) throw new Error("ComfyUI folder inventory unavailable");
      return response.json();
    };
    const [stats, inventory] = await Promise.all([
      read("/system_stats"),
      read("/experiment/models")
    ]);
    folders = inferSetupFolders(stats, inventory);
    if (
      !folders.root ||
      !path.isAbsolute(folders.root) ||
      !(
        await stat(path.join(folders.root, "main.py")).catch(() => null)
      )?.isFile()
    )
      return null;
  } catch {
    return null;
  }
  const copy: CopyModelToRunningComfy = Object.assign(
    async (item: ModelFileItem, signal: AbortSignal) => {
      signal.throwIfAborted();
      const category = path.basename(path.dirname(item.absolutePath));
      const aliases: Record<string, string[]> = {
        diffusion_models: ["diffusion_models", "unet"],
        unet: ["unet", "diffusion_models"],
        text_encoders: item.name.endsWith(".gguf")
          ? ["clip_gguf", "text_encoders", "clip"]
          : ["text_encoders", "clip"]
      };
      const folder =
        (aliases[category] ?? [category])
          .flatMap((key) => folders.categories[key] ?? [])
          .find((candidate) => path.isAbsolute(candidate)) ??
        path.join(folders.root!, "models", category);
      const destination = path.join(folder, item.name);
      const normalizePath = (value: string) =>
        process.platform === "win32"
          ? path.resolve(value).toLowerCase()
          : path.resolve(value);
      if (normalizePath(destination) === normalizePath(item.absolutePath))
        return;
      try {
        const existing = await stat(destination).catch(() => null);
        if (existing) {
          if (
            existing.isFile() &&
            existing.size === item.bytes &&
            (await hashFile(destination, signal)) === item.sha256
          )
            return;
          throw new Error(
            "A different file already exists at the active ComfyUI destination"
          );
        }
        await mkdir(folder, { recursive: true });
        await atomicProduceFile(destination, async (temporary) => {
          await copyFile(item.absolutePath, temporary);
          signal.throwIfAborted();
          if ((await hashFile(temporary, signal)) !== item.sha256)
            throw new Error("Copied model failed SHA-256 verification");
        });
      } catch (error) {
        if (signal.aborted) throw error;
        throw new Error(
          `${item.name} is saved in ${item.absolutePath}, but could not be copied to the running ComfyUI at ${destination}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    },
    { comfyRoot: folders.root! }
  );
  return copy;
};
