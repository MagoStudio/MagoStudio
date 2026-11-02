import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("electron", () => ({
  app: { isPackaged: false, getAppPath: () => process.cwd() }
}));

import { DatabaseManager } from "./databaseManager";

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
