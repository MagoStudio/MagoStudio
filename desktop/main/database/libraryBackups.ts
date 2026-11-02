import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { copyFile, mkdir, readFile, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { backup, DatabaseSync } from "node:sqlite";

import {
  atomicCopyFile,
  atomicWriteFile,
  publishFile,
  syncFile,
  temporaryFile
} from "../storage/atomicFile";

const MAX_BACKUPS = 5;

export class DatabaseCorruptionError extends Error {}

export const checkDatabase = (database: DatabaseSync): void => {
  const rows = database.prepare("PRAGMA quick_check").all();
  if (rows.length !== 1 || Object.values(rows[0])[0] !== "ok")
    throw new DatabaseCorruptionError(
      "The library database failed its integrity check."
    );
};

export const listBackups = async (root: string): Promise<string[]> => {
  try {
    return (await readdir(path.join(root, "backups")))
      .filter((name) => /^mago-\d{13}-[a-f0-9-]+\.sqlite3$/.test(name))
      .sort()
      .reverse()
      .map((name) => path.join(root, "backups", name));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
};

export const createLibraryBackup = async (root: string): Promise<string> => {
  await mkdir(path.join(root, "backups"), { recursive: true });
  const destination = path.join(
    root,
    "backups",
    `mago-${Date.now()}-${randomUUID()}.sqlite3`
  );
  const temporary = temporaryFile(destination);
  // A separate read connection lets the online backup include committed WAL data.
  const source = new DatabaseSync(path.join(root, "mago.sqlite3"), {
    readOnly: true
  });
  try {
    checkDatabase(source);
    await backup(source, temporary);
    const result = new DatabaseSync(temporary);
    try {
      result.exec("PRAGMA journal_mode = DELETE");
      checkDatabase(result);
    } finally {
      result.close();
    }
    await publishFile(temporary, destination);
    const backups = await listBackups(root);
    for (const old of backups.slice(MAX_BACKUPS)) await rm(old);
    return destination;
  } finally {
    source.close();
    await rm(temporary, { force: true }).catch(() => {});
    for (const suffix of ["-wal", "-shm"])
      await rm(`${temporary}${suffix}`, { force: true }).catch(() => {});
  }
};

const missing = (error: unknown): boolean =>
  (error as NodeJS.ErrnoException).code === "ENOENT";
const pendingPath = (root: string): string =>
  path.join(root, ".mago-restore.json");

/** Finish an explicitly requested restore even if power failed during replacement. */
export const finishPendingRestore = async (root: string): Promise<void> => {
  let directory: unknown;
  try {
    directory = JSON.parse(await readFile(pendingPath(root), "utf8"));
  } catch (error) {
    if (missing(error)) return;
    throw error;
  }
  if (typeof directory !== "string" || !/^recovery-[a-f0-9-]+$/.test(directory))
    throw new Error(
      "The database recovery record is damaged. Open the library folder to inspect it."
    );
  const staged = path.join(root, "backups", directory, "restore.sqlite3");
  let exists = true;
  try {
    await stat(staged);
  } catch (error) {
    if (missing(error)) exists = false;
    else throw error;
  }
  if (exists) {
    const check = new DatabaseSync(staged, { readOnly: true });
    try {
      checkDatabase(check);
    } finally {
      check.close();
    }
    // Originals are already preserved in the recovery directory before the marker is written.
    for (const suffix of ["-wal", "-shm"])
      await rm(path.join(root, `mago.sqlite3${suffix}`), { force: true });
    await publishFile(staged, path.join(root, "mago.sqlite3"));
  } else {
    const check = new DatabaseSync(path.join(root, "mago.sqlite3"), {
      readOnly: true
    });
    try {
      checkDatabase(check);
    } finally {
      check.close();
    }
  }
  await rm(pendingPath(root));
};

export const restoreLibraryBackup = async (
  root: string,
  selected: string
): Promise<string> => {
  if (!(await listBackups(root)).includes(selected))
    throw new Error("Choose a backup from this library.");
  const check = new DatabaseSync(selected, { readOnly: true });
  try {
    checkDatabase(check);
  } finally {
    check.close();
  }
  const directory = `recovery-${randomUUID()}`;
  const preserved = path.join(root, "backups", directory);
  await mkdir(preserved);
  for (const suffix of ["", "-wal", "-shm"]) {
    try {
      const destination = path.join(preserved, `mago.sqlite3${suffix}`);
      await copyFile(
        path.join(root, `mago.sqlite3${suffix}`),
        destination,
        constants.COPYFILE_EXCL
      );
      await syncFile(destination);
    } catch (error) {
      if (!missing(error)) throw error;
    }
  }
  await atomicCopyFile(selected, path.join(preserved, "restore.sqlite3"));
  await atomicWriteFile(pendingPath(root), JSON.stringify(directory));
  await finishPendingRestore(root);
  return preserved;
};
