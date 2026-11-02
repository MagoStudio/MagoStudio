import { randomUUID } from "node:crypto";
import { mkdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";

import { extractNodePack } from "./extractNodePack";
import { hashFile } from "./hashFile";
import { NodePackAlreadyInstalledError } from "./NodePackAlreadyInstalledError";
import { resolveNodePackBackupsFolder } from "./resolveNodePackBackupsFolder";
import type { DownloadableSetupRequirement } from "./resolveSetupRequirements";
import { resumableDownload } from "./resumableDownload";
import { swapInNodePack } from "./swapInNodePack";

export const downloadSetupRequirementIntoFolder = async (
  requirement: DownloadableSetupRequirement,
  folder: string,
  signal?: AbortSignal,
  {
    replaceExistingNodePack = false
  }: { replaceExistingNodePack?: boolean } = {}
): Promise<string> => {
  const filename =
    requirement.installKind === "node"
      ? `${new URL(requirement.url).pathname.split("/").filter(Boolean).at(-1)}.zip`
      : requirement.name;
  if (path.basename(filename) !== filename)
    throw new Error("Invalid download filename");
  const destination = path.join(folder, filename);
  signal?.throwIfAborted();
  const isNode = requirement.installKind === "node";
  const packDirectory = path.join(folder, filename.replace(/\.zip$/, ""));
  const hasExistingNodePack =
    isNode && Boolean(await stat(packDirectory).catch(() => null));
  if (hasExistingNodePack && !replaceExistingNodePack)
    throw new NodePackAlreadyInstalledError(packDirectory);
  if (isNode && !requirement.downloadSha256)
    throw new Error("No trusted hash is configured for this node pack.");
  const cachedNodePackArchiveSha256 =
    isNode && (await stat(destination).catch(() => null))
      ? await hashFile(destination, signal)
      : null;
  const isCachedNodePackArchiveTrusted =
    cachedNodePackArchiveSha256 === requirement.downloadSha256;
  if (cachedNodePackArchiveSha256 !== null && !isCachedNodePackArchiveTrusted)
    await rename(destination, destination + ".invalid-" + randomUUID());
  if (!isCachedNodePackArchiveTrusted)
    await resumableDownload(
      requirement.downloadUrl,
      destination,
      signal,
      undefined,
      requirement.downloadSha256
    );
  signal?.throwIfAborted();
  if (isNode) {
    const backupsFolder = resolveNodePackBackupsFolder(folder);
    const stagedNodePack = path.join(
      backupsFolder,
      ".incoming",
      `${path.basename(packDirectory)}-${Date.now()}`
    );
    const extractionTarget = hasExistingNodePack
      ? stagedNodePack
      : packDirectory;
    try {
      if (hasExistingNodePack)
        await mkdir(path.dirname(stagedNodePack), { recursive: true });
      await extractNodePack(
        destination,
        extractionTarget,
        requirement.archiveStripRoot
      );
    } catch (error) {
      if (hasExistingNodePack)
        await rm(stagedNodePack, { recursive: true, force: true });
      if (
        error instanceof Error &&
        /CRC|Invalid ZIP|ZIP entry size/.test(error.message)
      ) {
        const rejected = destination + ".invalid-" + randomUUID();
        await rename(destination, rejected);
        throw new Error(
          "ZIP integrity check failed. The damaged archive was set aside. Retry to download a fresh copy."
        );
      }
      throw error;
    }
    if (hasExistingNodePack)
      try {
        await swapInNodePack({
          stagedNodePack,
          nodePackDirectory: packDirectory,
          replacedNodePack: path.join(
            backupsFolder,
            `${path.basename(packDirectory)}-${Date.now()}`
          )
        });
      } finally {
        await rm(stagedNodePack, { recursive: true, force: true });
      }
    return packDirectory;
  }
  return destination;
};
