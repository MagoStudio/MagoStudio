import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import ffmpegPath from "ffmpeg-static";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("electron", () => ({
  app: {
    isPackaged: false,
    getAppPath: () => process.cwd()
  }
}));

import { DatabaseManager } from "../database/databaseManager";
import { assets, projects, scriptProjectMedia } from "../database/schema";

import { readLocalAssetInfo } from "./localAssetInfo";

const temporaryDirectories: string[] = [];
const managers: DatabaseManager[] = [];

afterEach(async () => {
  for (const manager of managers.splice(0)) manager.close();
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

const openLibrary = async () => {
  const libraryRoot = await mkdtemp(path.join(tmpdir(), "mago-asset-info-"));
  temporaryDirectories.push(libraryRoot);
  const manager = new DatabaseManager();
  managers.push(manager);
  await manager.open(libraryRoot);
  return { libraryRoot, manager };
};

const writeImage = (imagePath: string, size: string) =>
  spawnSync(ffmpegPath!, [
    "-hide_banner",
    "-loglevel",
    "error",
    "-f",
    "lavfi",
    "-i",
    `color=c=green:s=${size}`,
    "-frames:v",
    "1",
    imagePath
  ]);

describe("readLocalAssetInfo", () => {
  it("measures a library image whose size was never recorded", async () => {
    const { libraryRoot, manager } = await openLibrary();
    const imagePath = path.join(libraryRoot, "reference.png");
    writeImage(imagePath, "40x30");
    await manager.get().insert(assets).values({
      id: "asset-1",
      name: "reference.png",
      type: "image",
      sourcePath: imagePath,
      width: null,
      height: null
    });

    await expect(readLocalAssetInfo(manager, "asset-1")).resolves.toMatchObject(
      { extension: "png", width: 40, height: 30 }
    );
  });

  it("keeps the recorded size without probing the file", async () => {
    const { manager } = await openLibrary();
    await manager
      .get()
      .insert(assets)
      .values({
        id: "asset-2",
        name: "missing.jpg",
        type: "image",
        sourcePath: path.join(tmpdir(), "mago-missing.jpg"),
        width: 1024,
        height: 768
      });

    await expect(readLocalAssetInfo(manager, "asset-2")).resolves.toMatchObject(
      { extension: "jpg", width: 1024, height: 768 }
    );
  });

  it("measures script project media, which records no size", async () => {
    const { libraryRoot, manager } = await openLibrary();
    await mkdir(path.join(libraryRoot, "script-projects", "project-1"), {
      recursive: true
    });
    const relativePath = path.join(
      "script-projects",
      "project-1",
      "sheet.webp"
    );
    writeImage(path.join(libraryRoot, relativePath), "48x64");
    await manager
      .get()
      .insert(projects)
      .values({ id: "project-1", name: "Script" });
    await manager.get().insert(scriptProjectMedia).values({
      id: "media-1",
      projectId: "project-1",
      sourceUrl: "https://cdn.example/sheet.webp",
      relativePath
    });

    await expect(
      readLocalAssetInfo(manager, "media-1", { libraryRoot })
    ).resolves.toMatchObject({
      extension: "webp",
      width: 48,
      height: 64,
      type: "IMAGE"
    });
  });

  it("leaves script project media unmeasured when the library is unknown", async () => {
    const { manager } = await openLibrary();
    await manager
      .get()
      .insert(projects)
      .values({ id: "project-1", name: "Script" });
    await manager.get().insert(scriptProjectMedia).values({
      id: "media-1",
      projectId: "project-1",
      sourceUrl: "https://cdn.example/sheet.png",
      relativePath: "script-projects/project-1/sheet.png"
    });

    await expect(readLocalAssetInfo(manager, "media-1")).resolves.toMatchObject(
      { width: null, height: null }
    );
  });
});
