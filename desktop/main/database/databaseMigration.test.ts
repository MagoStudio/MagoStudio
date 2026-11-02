import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import { migrate } from "drizzle-orm/sqlite-proxy/migrator";
import { afterEach, describe, expect, test } from "vitest";

import { createDrizzleDatabase } from "./sqliteProxy";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, {
        recursive: true,
        force: true
      })
    )
  );
});

describe("desktop database migration", () => {
  test("creates the initial local project and asset tables", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "mago-studio-test-"));
    temporaryDirectories.push(directory);
    const sqlite = new DatabaseSync(path.join(directory, "mago.sqlite3"));
    const database = createDrizzleDatabase(sqlite);

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
      {
        migrationsFolder: path.join(
          process.cwd(),
          "desktop",
          "main",
          "database",
          "migrations"
        )
      }
    );

    const tables = sqlite
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name"
      )
      .all()
      .map((row) => (row as { name: string }).name);

    expect(tables).toEqual(
      expect.arrayContaining([
        "app_settings",
        "assets",
        "cloud_links",
        "cloud_render_jobs",
        "clips",
        "image_render_jobs",
        "project_assets",
        "projects",
        "script_chat_messages",
        "script_project_media",
        "script_project_snapshots",
        "shots",
        "tracks"
      ])
    );

    sqlite.close();
  });
});
