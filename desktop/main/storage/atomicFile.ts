import { randomUUID } from "node:crypto";
import type { Mode } from "node:fs";
import { copyFile, open, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export const temporaryFile = (destination: string): string =>
  path.join(
    path.dirname(destination),
    `.${path.basename(destination, path.extname(destination))}.mago-${randomUUID()}.tmp${path.extname(destination)}`
  );

const pendingRenameByDestination = new Map<string, Promise<void>>();

const destinationQueueKey = (destination: string): string => {
  const absoluteDestination = path.resolve(destination);
  return process.platform === "win32"
    ? absoluteDestination.toLowerCase()
    : absoluteDestination;
};

const renameInOrderPerDestination = (
  temporary: string,
  destination: string
): Promise<void> => {
  const queueKey = destinationQueueKey(destination);
  const previousRename =
    pendingRenameByDestination.get(queueKey) ?? Promise.resolve();
  const queuedRename = previousRename.then(() =>
    rename(temporary, destination)
  );
  const queuedRenameSettled = queuedRename.catch(() => {});
  pendingRenameByDestination.set(queueKey, queuedRenameSettled);
  void queuedRenameSettled.then(() => {
    if (pendingRenameByDestination.get(queueKey) === queuedRenameSettled)
      pendingRenameByDestination.delete(queueKey);
  });
  return queuedRename;
};

export const syncFile = async (temporary: string): Promise<void> => {
  const file = await open(temporary, "r+");
  try {
    await file.sync();
  } finally {
    await file.close();
  }
};
export const publishFile = async (
  temporary: string,
  destination: string
): Promise<void> => {
  await syncFile(temporary);
  await renameInOrderPerDestination(temporary, destination);
};

export const atomicWriteFile = async (
  destination: string,
  data: string | Uint8Array,
  options?: BufferEncoding | { mode?: Mode; encoding?: BufferEncoding }
): Promise<void> => {
  const temporary = temporaryFile(destination);
  try {
    await writeFile(temporary, data, {
      ...(typeof options === "string" ? { encoding: options } : options),
      flag: "wx",
      flush: true
    });
    await renameInOrderPerDestination(temporary, destination);
  } finally {
    await rm(temporary, { force: true }).catch(() => {});
  }
};

export const atomicCopyFile = async (
  source: string,
  destination: string
): Promise<void> => {
  const temporary = temporaryFile(destination);
  try {
    await copyFile(source, temporary);
    await publishFile(temporary, destination);
  } finally {
    await rm(temporary, { force: true }).catch(() => {});
  }
};

export const atomicProduceFile = async (
  destination: string,
  produce: (temporary: string) => Promise<void>
): Promise<void> => {
  const temporary = temporaryFile(destination);
  try {
    await produce(temporary);
    await publishFile(temporary, destination);
  } finally {
    await rm(temporary, { force: true }).catch(() => {});
  }
};
