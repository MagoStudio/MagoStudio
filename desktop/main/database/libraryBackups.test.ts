import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import { afterEach, expect, it } from "vitest";

import {
  createLibraryBackup,
  finishPendingRestore,
  listBackups,
  restoreLibraryBackup
} from "./libraryBackups";

const roots: string[] = [];
afterEach(async () => {
  for (const root of roots.splice(0))
    await rm(root, { recursive: true, force: true });
});
const library = async () => {
  const root = await mkdtemp(path.join(tmpdir(), "mago-backup-"));
  roots.push(root);
  const database = new DatabaseSync(path.join(root, "mago.sqlite3"));
  database.exec(
    "PRAGMA journal_mode=WAL; CREATE TABLE work(value TEXT); INSERT INTO work VALUES ('saved work')"
  );
  return { root, database };
};
it("backs up committed WAL data and keeps five complete backups", async () => {
  const { root, database } = await library();
  try {
    for (let index = 0; index < 7; index++) await createLibraryBackup(root);
    const files = await listBackups(root);
    expect(files).toHaveLength(5);
    expect(await readdir(path.join(root, "backups"))).toHaveLength(5);
    const copy = new DatabaseSync(files[0], { readOnly: true });
    try {
      expect(copy.prepare("SELECT value FROM work").get()).toEqual({
        value: "saved work"
      });
    } finally {
      copy.close();
    }
  } finally {
    database.close();
  }
});
it("preserves damaged database and sidecars before restoring", async () => {
  const { root, database } = await library();
  const selected = await createLibraryBackup(root);
  database.close();
  await writeFile(path.join(root, "mago.sqlite3"), "damaged original");
  await writeFile(path.join(root, "mago.sqlite3-wal"), "original journal");
  await writeFile(path.join(root, "mago.sqlite3-shm"), "original index");
  const preserved = await restoreLibraryBackup(root, selected);
  expect(await readFile(path.join(preserved, "mago.sqlite3"), "utf8")).toBe(
    "damaged original"
  );
  expect(await readFile(path.join(preserved, "mago.sqlite3-wal"), "utf8")).toBe(
    "original journal"
  );
  expect(await readFile(path.join(preserved, "mago.sqlite3-shm"), "utf8")).toBe(
    "original index"
  );
  const restored = new DatabaseSync(path.join(root, "mago.sqlite3"));
  try {
    expect(restored.prepare("SELECT value FROM work").get()).toEqual({
      value: "saved work"
    });
  } finally {
    restored.close();
  }
  await finishPendingRestore(root);
});
it("refuses an invalid backup without touching the original", async () => {
  const { root, database } = await library();
  const selected = await createLibraryBackup(root);
  database.close();
  const original = await readFile(path.join(root, "mago.sqlite3"));
  await writeFile(selected, "bad backup");
  await expect(restoreLibraryBackup(root, selected)).rejects.toThrow();
  expect(await readFile(path.join(root, "mago.sqlite3"))).toEqual(original);
});
it("finishes a restore interrupted after staging without losing the preserved original", async () => {
  const { root, database } = await library();
  const selected = await createLibraryBackup(root);
  database.close();
  await writeFile(path.join(root, "mago.sqlite3"), "damaged original");
  const directory = "recovery-00000000-0000-0000-0000-000000000000";
  const preserved = path.join(root, "backups", directory);
  await mkdir(preserved);
  await copyFile(
    path.join(root, "mago.sqlite3"),
    path.join(preserved, "mago.sqlite3")
  );
  await copyFile(selected, path.join(preserved, "restore.sqlite3"));
  await writeFile(
    path.join(root, ".mago-restore.json"),
    JSON.stringify(directory)
  );
  await finishPendingRestore(root);
  await finishPendingRestore(root);
  expect(await readFile(path.join(preserved, "mago.sqlite3"), "utf8")).toBe(
    "damaged original"
  );
  const restored = new DatabaseSync(path.join(root, "mago.sqlite3"));
  try {
    expect(restored.prepare("SELECT value FROM work").get()).toEqual({
      value: "saved work"
    });
  } finally {
    restored.close();
  }
  expect(await readdir(root)).not.toContain(".mago-restore.json");
});
