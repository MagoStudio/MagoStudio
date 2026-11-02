import { mkdir } from "node:fs/promises";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import type { SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy";
import { migrate } from "drizzle-orm/sqlite-proxy/migrator";
import { app } from "electron";

import {
  clearLibraryIssues,
  reportLibraryIssue,
  runBackgroundTask
} from "../libraryHealth";

import {
  checkDatabase,
  createLibraryBackup,
  DatabaseCorruptionError,
  finishPendingRestore,
  listBackups,
  restoreLibraryBackup
} from "./libraryBackups";
import * as schema from "./schema";
import { createDrizzleDatabase } from "./sqliteProxy";

export const CURRENT_SCHEMA_VERSION = 7;
const BACKUP_INTERVAL_MS = 900_000;
const SQLITE_CORRUPT = 11;
const SQLITE_NOTADB = 26;
const SQLITE_PRIMARY_ERROR_MASK = 255;
const isCorruption = (error: unknown): boolean => {
  const code = (error as { errcode?: number }).errcode;
  return (
    error instanceof DatabaseCorruptionError ||
    (typeof code === "number" &&
      [SQLITE_CORRUPT, SQLITE_NOTADB].includes(
        code & SQLITE_PRIMARY_ERROR_MASK
      ))
  );
};

export class DatabaseManager {
  private sqlite: DatabaseSync | null = null;
  private database: SqliteRemoteDatabase<typeof schema> | null = null;
  private backupTimer: ReturnType<typeof setInterval> | undefined;
  private backupRunning = false;
  private backupTask: Promise<void> | null = null;
  private unsafe = false;

  async open(libraryRoot: string): Promise<void> {
    this.close();
    await this.backupTask;
    this.unsafe = false;
    await finishPendingRestore(libraryRoot);
    await Promise.all([
      mkdir(path.join(libraryRoot, "thumbnails", "assets"), {
        recursive: true
      }),
      mkdir(path.join(libraryRoot, "thumbnails", "projects"), {
        recursive: true
      }),
      mkdir(path.join(libraryRoot, "temp"), { recursive: true }),
      mkdir(path.join(libraryRoot, "backups"), { recursive: true }),
      mkdir(path.join(libraryRoot, "renders", "images"), { recursive: true }),
      mkdir(path.join(libraryRoot, "script-projects"), { recursive: true })
    ]);

    const sqlite = new DatabaseSync(path.join(libraryRoot, "mago.sqlite3"));
    try {
      checkDatabase(sqlite);
      sqlite.exec("PRAGMA foreign_keys = ON");
      sqlite.exec("PRAGMA journal_mode = WAL");
      // Sync each commit so a sudden power loss cannot roll back acknowledged work.
      sqlite.exec("PRAGMA synchronous = FULL");

      if (
        sqlite
          .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
          .all().length > 0
      )
        await this.backupLibrary(libraryRoot);

      if (this.unsafe)
        throw new DatabaseCorruptionError(
          "The library became unreadable while backing it up."
        );
      const database = createDrizzleDatabase(
        sqlite,
        (error) => {
          if (isCorruption(error)) this.markUnsafe(error);
        },
        () => {
          if (this.unsafe)
            throw new Error(
              "Library access is paused. Restart Mago to recover a backup."
            );
        }
      );
      await migrate(
        database,
        async (queries) => {
          sqlite.exec("BEGIN");
          try {
            for (const query of queries) sqlite.exec(query);
            sqlite.exec("COMMIT");
          } catch (error) {
            sqlite.exec("ROLLBACK");
            throw error;
          }
        },
        { migrationsFolder: this.getMigrationsPath() }
      );

      this.sqlite = sqlite;
      this.database = database;
      this.unsafe = false;
      clearLibraryIssues();
      await this.backupLibrary(libraryRoot);
      this.backupTimer = setInterval(() => {
        void this.backupLibrary(libraryRoot);
      }, BACKUP_INTERVAL_MS);
      this.backupTimer.unref();
    } catch (error) {
      sqlite.close();
      throw error;
    }
  }

  get(): SqliteRemoteDatabase<typeof schema> {
    if (this.unsafe)
      throw new Error(
        "Library writes are paused because the database is damaged. Restart Mago to recover a backup."
      );
    if (!this.database) {
      throw new Error("The Mago library database is not open");
    }
    return this.database;
  }

  isOpen(): boolean {
    return this.database !== null;
  }

  async transaction<T>(
    callback: (database: SqliteRemoteDatabase<typeof schema>) => Promise<T>
  ): Promise<T> {
    this.get();
    if (!this.sqlite || !this.database) {
      throw new Error("The Mago library database is not open");
    }
    this.sqlite.exec("BEGIN IMMEDIATE");
    try {
      const result = await callback(this.database);
      this.sqlite.exec("COMMIT");
      return result;
    } catch (error) {
      this.sqlite.exec("ROLLBACK");
      throw error;
    }
  }

  close(): void {
    clearInterval(this.backupTimer);
    this.sqlite?.close();
    this.sqlite = null;
    this.database = null;
  }

  listBackups = listBackups;
  restoreBackup = restoreLibraryBackup;

  async suspendForRecovery(): Promise<void> {
    this.unsafe = true;
    this.close();
    await this.backupTask;
  }

  private async backupLibrary(root: string): Promise<void> {
    if (this.backupRunning) return;
    this.backupRunning = true;
    try {
      this.backupTask = runBackgroundTask("Database backup", async () => {
        const latest = (await listBackups(root))[0];
        if (
          latest &&
          Date.now() - Number(path.basename(latest).split("-")[1]) <
            BACKUP_INTERVAL_MS
        )
          return;
        try {
          await createLibraryBackup(root);
        } catch (error) {
          if (isCorruption(error)) this.markUnsafe(error);
          throw error;
        }
      });
      await this.backupTask;
    } finally {
      this.backupRunning = false;
      this.backupTask = null;
    }
  }

  markUnsafe(error: unknown): void {
    this.unsafe = true;
    reportLibraryIssue({
      id: "database",
      kind: "service",
      message: `Library access paused: ${String(error)}. Restart Mago to recover a backup.`
    });
  }

  private getMigrationsPath(): string {
    // Explicit override for harnesses that run the main process from outside the
    // app root, where app.getAppPath() is the script's directory rather than the
    // project. Never set in a packaged build.
    if (process.env.MAGO_MIGRATIONS_PATH) {
      return process.env.MAGO_MIGRATIONS_PATH;
    }
    if (app.isPackaged) {
      return path.join(process.resourcesPath, "migrations");
    }
    if (process.env.MAGO_PACKAGED_SMOKE === "1") {
      return path.join(path.dirname(app.getAppPath()), "migrations");
    }
    return path.join(
      app.getAppPath(),
      "desktop",
      "main",
      "database",
      "migrations"
    );
  }
}
