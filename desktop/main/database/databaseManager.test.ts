import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("electron", () => ({
  app: { isPackaged: false, getAppPath: () => process.cwd() }
}));

import { DatabaseManager } from "./databaseManager";
import { projects } from "./schema";

const directories: string[] = [];
afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

describe("database startup", () => {
  it("uses durable commits and reopens a committed library", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "mago-db-recovery-"));
    directories.push(directory);
    const manager = new DatabaseManager();
    try {
      await manager.open(directory);
      const rows = await manager.get().all<[number]>("PRAGMA synchronous");
      expect(rows).toEqual([[2]]);
      manager.close();
      await manager.open(directory);
      expect(manager.isOpen()).toBe(true);
    } finally {
      manager.close();
    }
  });
  it("reports a malformed database without replacing it", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "mago-db-recovery-"));
    directories.push(directory);
    const filename = path.join(directory, "mago.sqlite3");
    await writeFile(filename, "damaged database");
    const manager = new DatabaseManager();
    await expect(manager.open(directory)).rejects.toThrow();
    expect(manager.isOpen()).toBe(false);
    expect(await readFile(filename, "utf8")).toBe("damaged database");
  });
});

const roots: string[] = [];
const managers: DatabaseManager[] = [];
afterEach(async () => {
  managers.splice(0).forEach((manager) => manager.close());
  for (const root of roots.splice(0))
    await rm(root, { recursive: true, force: true });
});
const emptyLibrary = async () => {
  const root = await mkdtemp(path.join(tmpdir(), "mago-database-manager-"));
  roots.push(root);
  const manager = new DatabaseManager();
  managers.push(manager);
  return { root, manager };
};
const hasJournalFile = async (root: string): Promise<boolean> =>
  (await readdir(root)).includes("mago.sqlite3-wal");

it("opens the library once when many requests find it closed together", async () => {
  const { root, manager } = await emptyLibrary();

  await Promise.all(
    Array.from({ length: 10 }, () => manager.openIfClosed(root))
  );
  manager.close();

  expect(await hasJournalFile(root)).toBe(false);
});

it("never leaves a second connection behind when opens overlap", async () => {
  const { root, manager } = await emptyLibrary();

  await Promise.all([manager.open(root), manager.open(root)]);
  manager.close();

  expect(await hasJournalFile(root)).toBe(false);
});

it("refuses to reopen the library while a restore is pending", async () => {
  const { root, manager } = await emptyLibrary();
  await manager.open(root);

  await manager.suspendForRecovery();

  await expect(manager.openIfClosed(root)).rejects.toThrow(
    "restoring a library backup"
  );
  expect(manager.isOpen()).toBe(false);
  expect(await hasJournalFile(root)).toBe(false);
});

it("finishes a staged restore the next time the library opens", async () => {
  const { root, manager } = await emptyLibrary();
  await manager.open(root);
  const [backup] = await manager.listBackups(root);
  await manager.get().insert(projects).values({ id: "later", name: "Later" });

  await manager.suspendForRecovery();
  const preserved = await manager.restoreBackup(root, backup);

  const restarted = new DatabaseManager();
  managers.push(restarted);
  await restarted.open(root);
  const projectIds = (
    await restarted.get().select({ id: projects.id }).from(projects)
  ).map((project) => project.id);
  expect(projectIds).not.toContain("later");
  expect(await readdir(preserved)).toContain("mago.sqlite3");
});

it("stops an open that was already running when a restore begins", async () => {
  const { root, manager } = await emptyLibrary();
  await manager.open(root);
  manager.close();

  const openingBeforeRestore = manager.open(root);
  await manager.suspendForRecovery();

  await expect(openingBeforeRestore).rejects.toThrow(
    "restoring a library backup"
  );
  expect(manager.isOpen()).toBe(false);
  expect(await hasJournalFile(root)).toBe(false);
});

it("lets the library reopen when staging a restore fails", async () => {
  const { root, manager } = await emptyLibrary();
  await manager.open(root);
  await manager.suspendForRecovery();

  await expect(
    manager.restoreBackup(root, path.join(root, "not-a-backup.sqlite3"))
  ).rejects.toThrow("Choose a backup from this library.");
  await manager.openIfClosed(root);

  expect(manager.isOpen()).toBe(true);
});
