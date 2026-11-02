import { access, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, test, vi } from "vitest";

vi.mock("electron", () => ({
  app: {
    isPackaged: false,
    getAppPath: () => process.cwd()
  }
}));

import { eq } from "drizzle-orm";

import { DatabaseManager } from "./databaseManager";
import { clipTimelineFrames, ProjectRepository } from "./projectRepository";
import {
  assets,
  clips,
  projects,
  scriptProjectSnapshots,
  shots,
  tracks
} from "./schema";

const temporaryDirectories: string[] = [];
const managers: DatabaseManager[] = [];

afterEach(async () => {
  vi.restoreAllMocks();
  for (const manager of managers.splice(0)) manager.close();
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

describe("ProjectRepository", () => {
  test.each([
    { origin: "cloud", type: "script_to_shots" },
    { origin: "local", type: "timeline" }
  ])(
    "does not migrate legacy style for $origin $type projects",
    async ({ origin, type }) => {
      const root = await mkdtemp(
        path.join(tmpdir(), "mago-legacy-style-scope-")
      );
      temporaryDirectories.push(root);
      const manager = new DatabaseManager();
      managers.push(manager);
      await manager.open(root);
      const repository = new ProjectRepository(manager, async () => root);
      const project = await repository.create({
        name: "Project",
        description: "",
        settings: { type }
      });
      await manager
        .get()
        .update(projects)
        .set({ settingsJson: JSON.stringify({ origin, type }) })
        .where(eq(projects.id, project.id));
      await manager
        .get()
        .insert(scriptProjectSnapshots)
        .values({
          projectId: project.id,
          stateJson: JSON.stringify({ visual_style: "Legacy ink" })
        });
      expect((await repository.get(project.id))?.settings).not.toHaveProperty(
        "visual_style"
      );
    }
  );
  test.each([
    { legacy: "Legacy ink", stored: undefined, expected: "Legacy ink" },
    { legacy: "", stored: undefined, expected: "" },
    { legacy: null, stored: undefined, expected: null },
    { legacy: "Legacy ink", stored: "User style", expected: "User style" },
    { legacy: "Legacy ink", stored: "", expected: "" },
    { legacy: "Legacy ink", stored: null, expected: null }
  ])(
    "returns the migrated visual style on the first project read: %j",
    async ({ legacy, stored, expected }) => {
      const root = await mkdtemp(path.join(tmpdir(), "mago-legacy-style-"));
      temporaryDirectories.push(root);
      const manager = new DatabaseManager();
      managers.push(manager);
      await manager.open(root);
      const repository = new ProjectRepository(manager, async () => root);
      const project = await repository.create({
        name: "Legacy",
        description: "",
        settings: {
          type: "script_to_shots",
          ...(stored === undefined ? {} : { visual_style: stored })
        }
      });
      await manager
        .get()
        .insert(scriptProjectSnapshots)
        .values({
          projectId: project.id,
          stateJson: JSON.stringify({
            visual_style: legacy,
            keys: [],
            shots: []
          })
        });
      expect((await repository.get(project.id))?.settings).toMatchObject({
        visual_style: expected
      });
      const [persisted] = await manager
        .get()
        .select()
        .from(projects)
        .where(eq(projects.id, project.id));
      expect(JSON.parse(persisted!.settingsJson)).toMatchObject({
        visual_style: expected
      });
    }
  );

  test.each([
    "not-json",
    "null",
    "[]",
    '{"visual_style":123}',
    '{"keys":[],"shots":[]}'
  ])(
    "leaves an invalid or absent legacy style alone: %s",
    async (stateJson) => {
      const root = await mkdtemp(
        path.join(tmpdir(), "mago-legacy-style-invalid-")
      );
      temporaryDirectories.push(root);
      const manager = new DatabaseManager();
      managers.push(manager);
      await manager.open(root);
      const repository = new ProjectRepository(manager, async () => root);
      const project = await repository.create({
        name: "Legacy",
        description: "",
        settings: { type: "script_to_shots" }
      });
      await manager
        .get()
        .insert(scriptProjectSnapshots)
        .values({ projectId: project.id, stateJson });
      expect((await repository.get(project.id))?.settings).not.toHaveProperty(
        "visual_style"
      );
      const [snapshot] = await manager
        .get()
        .select()
        .from(scriptProjectSnapshots)
        .where(eq(scriptProjectSnapshots.projectId, project.id));
      expect(snapshot!.stateJson).toBe(stateJson);
    }
  );
  test("seeds visual style once, preserves other settings and respects a clear", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "mago-style-"));
    temporaryDirectories.push(root);
    const manager = new DatabaseManager();
    managers.push(manager);
    await manager.open(root);
    const repository = new ProjectRepository(manager, async () => root);
    const project = await repository.create({
      name: "Style",
      description: "",
      settings: { rangeMin: 0 }
    });
    expect(
      await repository.setSettingIfAbsent(project.id, "visual_style", "Ink")
    ).toBe(true);
    expect(
      await repository.setSettingIfAbsent(project.id, "visual_style", "Paint")
    ).toBe(false);
    expect((await repository.get(project.id))?.settings).toMatchObject({
      rangeMin: 0,
      visual_style: "Ink"
    });
    await repository.update({
      projectId: project.id,
      name: "Style",
      description: "",
      settings: { visual_style: null }
    });
    expect(
      await repository.setSettingIfAbsent(project.id, "visual_style", "Paint")
    ).toBe(false);
    expect((await repository.get(project.id))?.settings).toMatchObject({
      visual_style: null
    });
    await expect(
      repository.update({
        projectId: project.id,
        name: "Style",
        description: "",
        settings: { visual_style: 123 }
      })
    ).rejects.toThrow("settings.visual_style must be a string or null");
    expect((await repository.get(project.id))?.settings).toMatchObject({
      visual_style: null
    });
  });
  test("batches catalog reads while keeping local counts and cloud fallbacks", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "mago-catalog-"));
    temporaryDirectories.push(root);
    const manager = new DatabaseManager();
    managers.push(manager);
    await manager.open(root);
    const database = manager.get();
    await database.insert(projects).values([
      {
        id: "script",
        name: "Script",
        settingsJson: JSON.stringify({ type: "script_to_shots" })
      },
      { id: "timeline", name: "Timeline" },
      {
        id: "cloud",
        name: "Cloud",
        settingsJson: JSON.stringify({
          origin: "cloud",
          cloudSummary: {
            timeline_count: 12,
            total_renders: 9,
            total_img2img: 5,
            preview_url: "cloud-preview"
          }
        })
      },
      { id: "hidden", name: "Hidden", active: false }
    ]);
    await database.insert(shots).values([
      { id: "visible-shot", projectId: "timeline", name: "Shot" },
      {
        id: "removed-shot",
        projectId: "timeline",
        name: "Removed",
        active: false
      }
    ]);
    await database.insert(scriptProjectSnapshots).values({
      projectId: "script",
      stateJson: JSON.stringify({ shots: [{}, {}] }),
      cutJson: JSON.stringify({ shots: [{ asset_id: "render" }, {}] }),
      previewUrl: "script-preview",
      planDetailsJson: "unused plan history"
    });
    const select = vi.spyOn(database, "select");
    const repository = new ProjectRepository(manager, async () => root);
    const rows = await repository.list();
    expect(select).toHaveBeenCalledTimes(5);
    expect(rows).toHaveLength(3);
    expect(rows.find((row) => row.id === "script")).toMatchObject({
      timeline_count: 2,
      total_renders: 1,
      preview_url: "script-preview",
      origin: "local"
    });
    expect(rows.find((row) => row.id === "timeline")).toMatchObject({
      timeline_count: 1
    });
    expect(rows.find((row) => row.id === "cloud")).toMatchObject({
      timeline_count: 12,
      total_renders: 9,
      total_img2img: 5,
      preview_url: "cloud-preview",
      origin: "cloud"
    });
    const list = vi.spyOn(repository, "list");
    expect(
      (await repository.listAll()).map((project) => project.id).sort()
    ).toEqual(["cloud", "script", "timeline"]);
    expect(list).not.toHaveBeenCalled();
  });

  test("keeps a generated clip on its requested timeline range when output fps differs", () => {
    expect(
      clipTimelineFrames({
        clipData: { frame_range: [0, 49] },
        assetFrameCount: 25,
        assetFps: 16,
        timelineOffsetMs: 0
      })
    ).toEqual({ duration: 49, timelineOffset: 0 });

    expect(
      clipTimelineFrames({
        clipData: { frame_range: [30, 79] },
        assetFrameCount: 25,
        assetFps: 16,
        timelineOffsetMs: 1_000
      })
    ).toEqual({ duration: 49, timelineOffset: 30 });

    expect(
      clipTimelineFrames({
        clipData: { frame_range: [0, 80] },
        assetFrameCount: 81,
        assetFps: 24,
        timelineOffsetMs: 0
      })
    ).toEqual({ duration: 80, timelineOffset: 0 });
  });

  test("persists projects and linked videos across a database restart", async () => {
    const libraryRoot = await mkdtemp(path.join(tmpdir(), "mago-library-"));
    const sourceRoot = await mkdtemp(path.join(tmpdir(), "mago-sources-"));
    temporaryDirectories.push(libraryRoot, sourceRoot);
    const firstSource = path.join(sourceRoot, "first.mp4");
    const secondSource = path.join(sourceRoot, "second.mp4");
    await Promise.all([
      writeFile(firstSource, "first source remains untouched"),
      writeFile(secondSource, "second source remains untouched")
    ]);

    const manager = new DatabaseManager();
    managers.push(manager);
    await manager.open(libraryRoot);
    const repository = new ProjectRepository(manager, async () => libraryRoot);
    const project = await repository.create({
      name: "Untitled project",
      description: "",
      settings: { rangeMin: 0, rangeMax: 120 }
    });

    const imports = await repository.importVideos(project.id, [
      video(firstSource, "first.mp4"),
      video(secondSource, "second.mp4")
    ]);
    expect(imports).toHaveLength(2);
    expect(await repository.list()).toEqual([
      expect.objectContaining({
        id: project.id,
        origin: "local",
        timeline_count: 2,
        preview_url: expect.stringMatching(/^mago-media:\/\/thumbnail\//)
      })
    ]);
    manager.close();

    const reopenedManager = new DatabaseManager();
    managers.push(reopenedManager);
    await reopenedManager.open(libraryRoot);
    const reopenedRepository = new ProjectRepository(
      reopenedManager,
      async () => libraryRoot
    );
    const reopenedProject = await reopenedRepository.get(project.id);
    expect(reopenedProject?.timelines).toHaveLength(2);
    expect(reopenedProject?.origin).toBe("local");
    expect(JSON.stringify(reopenedProject)).toContain("mago-media://asset/");
    const firstAsset = await reopenedRepository.getAsset(imports[0]!.assetId);
    expect(firstAsset).toEqual(
      expect.objectContaining({
        filepath: `mago-media://asset/${imports[0]!.assetId}`,
        data: expect.objectContaining({
          duration: 48,
          duration_seconds: 2,
          fps: 24,
          queue_status: "FINISHED",
          total_frames: 48
        })
      })
    );
    const firstTimeline = (
      reopenedProject!.timelines as Array<{
        layers: Array<{ clips: Array<{ data: { duration: number } }> }>;
      }>
    )[0]!;
    expect(firstTimeline.layers[0]!.clips[0]!.data.duration).toBe(48);

    await reopenedRepository.delete(project.id);
    expect(await reopenedRepository.list()).toEqual([]);
    await Promise.all([access(firstSource), access(secondSource)]);
    expect(
      await readdir(path.join(libraryRoot, "thumbnails", "assets"))
    ).toHaveLength(2);
    reopenedManager.close();
  });

  test("persists imported images as uploaded project assets without copying the source", async () => {
    const libraryRoot = await mkdtemp(path.join(tmpdir(), "mago-library-"));
    const sourceRoot = await mkdtemp(path.join(tmpdir(), "mago-sources-"));
    temporaryDirectories.push(libraryRoot, sourceRoot);
    const sourcePath = path.join(sourceRoot, "reference.png");
    await writeFile(sourcePath, "original image remains on the user drive");

    const manager = new DatabaseManager();
    managers.push(manager);
    await manager.open(libraryRoot);
    const repository = new ProjectRepository(manager, async () => libraryRoot);
    const project = await repository.create({
      name: "Image references",
      description: "",
      settings: {}
    });

    const imported = await repository.importImage({
      projectId: project.id,
      sourcePath,
      name: "reference.png",
      width: 1024,
      height: 768,
      // Canvas-based thumbnail generation historically emitted image/jpg for
      // .jpg files. Accept it as the JPEG alias so valid uploads remain valid.
      thumbnailDataUrl: "data:image/jpg;base64,/9j/2Q=="
    });

    expect(imported).toEqual(
      expect.objectContaining({
        filepath: `mago-media://asset/${imported.id}`,
        origin: "uploaded",
        type: "IMAGE",
        data: expect.objectContaining({
          origin: "uploaded",
          size: [1024, 768],
          status: "ingested",
          thumbnail_filepath: `mago-media://thumbnail/${imported.id}`
        })
      })
    );
    await access(sourcePath);
    expect(
      await readdir(path.join(libraryRoot, "thumbnails", "assets"))
    ).toHaveLength(1);

    manager.close();
    const reopenedManager = new DatabaseManager();
    managers.push(reopenedManager);
    await reopenedManager.open(libraryRoot);
    const reopenedRepository = new ProjectRepository(
      reopenedManager,
      async () => libraryRoot
    );
    expect(await reopenedRepository.getAsset(imported.id)).toEqual(
      expect.objectContaining({
        origin: "uploaded",
        data: expect.objectContaining({ origin: "uploaded" })
      })
    );
  });
});

describe("ProjectRepository mutations", () => {
  test("uses the first casting title only for Untitled placeholders", async () => {
    const libraryRoot = await mkdtemp(path.join(tmpdir(), "mago-library-"));
    temporaryDirectories.push(libraryRoot);
    const manager = new DatabaseManager();
    managers.push(manager);
    await manager.open(libraryRoot);
    const repository = new ProjectRepository(manager, async () => libraryRoot);

    const placeholders = [];
    for (const name of ["Untitled", "untitled_1699999999", "Untitled_2"]) {
      placeholders.push(
        await repository.create({
          name,
          description: "",
          settings: { type: "script_to_shots" }
        })
      );
    }
    const named = await repository.create({
      name: "My Great Film",
      description: "",
      settings: { type: "script_to_shots" }
    });

    for (const project of placeholders) {
      await repository.renameUntitledFromCasting(project.id, "Ruined Colony");
    }
    await repository.renameUntitledFromCasting(named.id, "Ruined Colony");

    await expect(
      Promise.all(placeholders.map((project) => repository.get(project.id)))
    ).resolves.toEqual([
      expect.objectContaining({ name: "Ruined Colony" }),
      expect.objectContaining({ name: "Ruined Colony" }),
      expect.objectContaining({ name: "Ruined Colony" })
    ]);
    await expect(repository.get(named.id)).resolves.toEqual(
      expect.objectContaining({ name: "My Great Film" })
    );
  });

  test("appends a new empty shot after the project's existing shots", async () => {
    const libraryRoot = await mkdtemp(path.join(tmpdir(), "mago-library-"));
    temporaryDirectories.push(libraryRoot);
    const manager = new DatabaseManager();
    managers.push(manager);
    await manager.open(libraryRoot);
    const repository = new ProjectRepository(manager, async () => libraryRoot);
    const project = await repository.create({
      name: "Shots",
      description: "",
      settings: {}
    });

    const created = await repository.createShot({
      projectId: project.id,
      name: "Image to Video"
    });

    expect(created).toEqual(
      expect.objectContaining({
        name: "Image to Video",
        project_id: project.id,
        layers: []
      })
    );
    const timelines = (await repository.get(project.id))?.timelines as Array<{
      id: string;
      name: string;
    }>;
    expect(timelines.map((timeline) => timeline.name)).toEqual([
      "Untitled",
      "Image to Video"
    ]);
    await expect(
      repository.createShot({ projectId: "missing", name: "Nope" })
    ).rejects.toThrow("Local project not found");
  });

  test("caps a casting title at 200 Unicode characters", async () => {
    const libraryRoot = await mkdtemp(path.join(tmpdir(), "mago-library-"));
    temporaryDirectories.push(libraryRoot);
    const manager = new DatabaseManager();
    managers.push(manager);
    await manager.open(libraryRoot);
    const repository = new ProjectRepository(manager, async () => libraryRoot);
    const project = await repository.create({
      name: "Untitled",
      description: "",
      settings: { type: "script_to_shots" }
    });

    await repository.renameUntitledFromCasting(project.id, "🎬".repeat(201));

    const renamed = await repository.get(project.id);
    expect(Array.from(renamed?.name ?? "")).toHaveLength(200);
    expect(renamed?.name).toBe("🎬".repeat(200));
  });

  test("persists track renames, ratings and soft deletes without touching sources", async () => {
    const libraryRoot = await mkdtemp(path.join(tmpdir(), "mago-library-"));
    const sourceRoot = await mkdtemp(path.join(tmpdir(), "mago-sources-"));
    temporaryDirectories.push(libraryRoot, sourceRoot);
    const sourcePath = path.join(sourceRoot, "shot.mp4");
    await writeFile(sourcePath, "source remains untouched");

    const manager = new DatabaseManager();
    managers.push(manager);
    await manager.open(libraryRoot);
    const repository = new ProjectRepository(manager, async () => libraryRoot);
    const project = await repository.create({
      name: "Mutations",
      description: "",
      settings: {}
    });
    const [imported] = await repository.importVideos(project.id, [
      video(sourcePath, "shot.mp4")
    ]);
    const shotId = imported!.shotId;

    const created = await repository.createTrack({
      shotId,
      name: "Render 1",
      type: "RENDER",
      data: { renderEngine: "magov2" },
      parentTrackOrder: 1
    });
    const trackId = String(created.id);

    const updated = await repository.updateTrack({
      trackId,
      name: "Hero render",
      data: { renderEngine: "magov2", hasBeenSeen: true },
      rating: 3
    });
    expect(updated).toEqual(
      expect.objectContaining({
        name: "Hero render",
        rating: 3,
        data: { renderEngine: "magov2", hasBeenSeen: true }
      })
    );

    await repository.updateShot({
      shotId,
      name: "Opening shot",
      settings: { rangeMin: 4 }
    });

    manager.close();
    const reopenedManager = new DatabaseManager();
    managers.push(reopenedManager);
    await reopenedManager.open(libraryRoot);
    const reopened = new ProjectRepository(
      reopenedManager,
      async () => libraryRoot
    );

    const timelines = (await reopened.get(project.id))?.timelines as Array<{
      id: string;
      name: string;
      settings: Record<string, unknown>;
      layers: Array<{ id: string; name: string; rating: number }>;
    }>;
    expect(timelines[0]).toEqual(
      expect.objectContaining({
        name: "Opening shot",
        settings: { rangeMin: 4 }
      })
    );
    expect(timelines[0]!.layers.find((layer) => layer.id === trackId)).toEqual(
      expect.objectContaining({ name: "Hero render", rating: 3 })
    );

    await reopened.deleteTrack(trackId);
    const afterTrackDelete = (await reopened.get(project.id))
      ?.timelines as Array<{ layers: Array<{ id: string }> }>;
    expect(
      afterTrackDelete[0]!.layers.some((layer) => layer.id === trackId)
    ).toBe(false);

    await reopened.deleteShot(shotId);
    expect((await reopened.get(project.id))?.timelines).toEqual([]);
    expect(await reopened.listShots(project.id)).toEqual([]);
    await access(sourcePath);
  });

  test("persists an image asset rating", async () => {
    const libraryRoot = await mkdtemp(path.join(tmpdir(), "mago-library-"));
    const sourceRoot = await mkdtemp(path.join(tmpdir(), "mago-sources-"));
    temporaryDirectories.push(libraryRoot, sourceRoot);
    const sourcePath = path.join(sourceRoot, "reference.png");
    await writeFile(sourcePath, "image stays put");

    const manager = new DatabaseManager();
    managers.push(manager);
    await manager.open(libraryRoot);
    const repository = new ProjectRepository(manager, async () => libraryRoot);
    const project = await repository.create({
      name: "Ratings",
      description: "",
      settings: {}
    });
    const imported = await repository.importImage({
      projectId: project.id,
      sourcePath,
      name: "reference.png",
      width: 512,
      height: 512,
      thumbnailDataUrl: "data:image/png;base64,iVBORw0KGgo="
    });

    expect(imported.rate).toBe(0);
    expect(
      await repository.updateAsset({ assetId: imported.id, rate: 2 })
    ).toEqual(expect.objectContaining({ rate: 2 }));
    expect(await repository.getAsset(imported.id)).toEqual(
      expect.objectContaining({ rate: 2 })
    );
  });

  test("fills an image description once and never overwrites one, even a blank one", async () => {
    const libraryRoot = await mkdtemp(path.join(tmpdir(), "mago-library-"));
    const sourceRoot = await mkdtemp(path.join(tmpdir(), "mago-sources-"));
    temporaryDirectories.push(libraryRoot, sourceRoot);
    const sourcePath = path.join(sourceRoot, "reference.png");
    await writeFile(sourcePath, "image stays put");

    const manager = new DatabaseManager();
    managers.push(manager);
    await manager.open(libraryRoot);
    const repository = new ProjectRepository(manager, async () => libraryRoot);
    const project = await repository.create({
      name: "Descriptions",
      description: "",
      settings: {}
    });
    const importImage = () =>
      repository.importImage({
        projectId: project.id,
        sourcePath,
        name: "reference.png",
        width: 512,
        height: 512,
        thumbnailDataUrl: "data:image/png;base64,iVBORw0KGgo="
      });

    const described = await importImage();
    await repository.setAssetDescriptionIfAbsent(described.id, "a red coat");
    await repository.setAssetDescriptionIfAbsent(described.id, "a blue coat");
    expect((await repository.getAsset(described.id))?.data).toEqual(
      expect.objectContaining({ description: "a red coat", status: "ingested" })
    );

    // A blank description is the user's choice, not a missing one.
    const cleared = await importImage();
    await repository.setAssetPrompt(cleared.id, { positive: "kept" });
    await repository.setAssetDescriptionIfAbsent(cleared.id, "");
    await repository.setAssetDescriptionIfAbsent(cleared.id, "a red coat");
    expect((await repository.getAsset(cleared.id))?.data).toEqual(
      expect.objectContaining({ description: "", prompt: { positive: "kept" } })
    );
  });

  test("aggregates project stats from local render jobs", async () => {
    const libraryRoot = await mkdtemp(path.join(tmpdir(), "mago-library-"));
    temporaryDirectories.push(libraryRoot);
    const manager = new DatabaseManager();
    managers.push(manager);
    await manager.open(libraryRoot);
    const repository = new ProjectRepository(manager, async () => libraryRoot);
    const project = await repository.create({
      name: "Stats",
      description: "",
      settings: {}
    });

    expect(await repository.projectStats(project.id)).toEqual({
      total: expect.objectContaining({
        total_amount_of_renders: 0,
        total_cost: 0,
        success_rate: 0
      })
    });
  });
});

describe("ProjectRepository cloud parity", () => {
  const openRepository = async () => {
    const libraryRoot = await mkdtemp(path.join(tmpdir(), "mago-library-"));
    temporaryDirectories.push(libraryRoot);
    const manager = new DatabaseManager();
    managers.push(manager);
    await manager.open(libraryRoot);
    return {
      database: manager.get(),
      repository: new ProjectRepository(manager, async () => libraryRoot)
    };
  };

  const seedShotWithSourceTrack = async (
    database: ReturnType<DatabaseManager["get"]>
  ) => {
    const longAgo = new Date("2026-01-01T00:00:00.000Z");
    await database.insert(projects).values({
      id: "project",
      name: "Parity",
      createdAt: longAgo,
      updatedAt: longAgo
    });
    await database.insert(shots).values([
      {
        id: "shot",
        projectId: "project",
        name: "Shot",
        position: 0,
        createdAt: longAgo,
        updatedAt: longAgo
      },
      {
        id: "other-shot",
        projectId: "project",
        name: "Other",
        position: 1,
        createdAt: longAgo,
        updatedAt: longAgo
      }
    ]);
    await database.insert(tracks).values([
      {
        id: "source",
        shotId: "shot",
        projectId: "project",
        name: "Source",
        type: "IMAGE",
        position: 0
      },
      {
        id: "older-render",
        shotId: "shot",
        projectId: "project",
        name: "Older render",
        type: "RENDER",
        position: 1
      },
      {
        id: "deleted-render",
        shotId: "shot",
        projectId: "project",
        name: "Deleted render",
        type: "RENDER",
        position: 2,
        active: false
      }
    ]);
    return longAgo;
  };

  const insertRenderClip = async (
    database: ReturnType<DatabaseManager["get"]>,
    {
      trackId,
      assetStatus,
      assetData = {}
    }: {
      trackId: string;
      assetStatus: string;
      assetData?: Record<string, unknown>;
    }
  ) => {
    await database.insert(assets).values({
      id: `asset-${trackId}`,
      name: "render.mp4",
      type: "video",
      origin: "generated",
      sourcePath: "",
      status: assetStatus,
      dataJson: JSON.stringify(assetData)
    });
    await database.insert(clips).values({
      id: `clip-${trackId}`,
      trackId,
      assetId: `asset-${trackId}`,
      name: "render"
    });
  };

  const layersOf = async (repository: ProjectRepository, shotId: string) =>
    (
      (await repository.get("project"))!.timelines as Array<{
        id: string;
        layers: Array<{ id: string; layer_order: number }>;
      }>
    ).find((timeline) => timeline.id === shotId)!.layers;

  test("inserts a new Render Track right under its source and shifts the later ones", async () => {
    const { database, repository } = await openRepository();
    const longAgo = await seedShotWithSourceTrack(database);

    const created = await repository.createTrack({
      shotId: "shot",
      name: "New render",
      type: "RENDER",
      data: {},
      parentTrackOrder: 0
    });

    expect(created).toEqual(expect.objectContaining({ layer_order: 1 }));
    expect(
      (await layersOf(repository, "shot")).map((layer) => [
        layer.id,
        layer.layer_order
      ])
    ).toEqual([
      ["source", 0],
      [created.id, 1],
      ["older-render", 2]
    ]);
    const [deletedRender] = await database
      .select({ position: tracks.position })
      .from(tracks)
      .where(eq(tracks.id, "deleted-render"));
    expect(deletedRender!.position).toBe(2);

    const [project] = await database
      .select({ updatedAt: projects.updatedAt })
      .from(projects)
      .where(eq(projects.id, "project"));
    expect(project!.updatedAt.getTime()).toBeGreaterThan(longAgo.getTime());
    const [shotList] = await repository.listShots("project");
    expect(shotList).toEqual(
      expect.objectContaining({
        id: "shot",
        created_at: longAgo.toISOString()
      })
    );
    expect(Date.parse(shotList!.updated_at)).toBeGreaterThan(longAgo.getTime());
  });

  test("bumps the Shot when a track is updated or deleted", async () => {
    const { database, repository } = await openRepository();
    const longAgo = await seedShotWithSourceTrack(database);
    const shotUpdatedAt = async () =>
      (
        await database
          .select({ updatedAt: shots.updatedAt })
          .from(shots)
          .where(eq(shots.id, "shot"))
      )[0]!.updatedAt.getTime();

    await repository.updateTrack({
      trackId: "older-render",
      name: "Renamed",
      data: {}
    });
    expect(await shotUpdatedAt()).toBeGreaterThan(longAgo.getTime());

    await database
      .update(shots)
      .set({ updatedAt: longAgo })
      .where(eq(shots.id, "shot"));
    await repository.deleteTrack("older-render");
    expect(await shotUpdatedAt()).toBeGreaterThan(longAgo.getTime());
  });

  test("counts finished renders on active Render Tracks per project and per Shot", async () => {
    const { database, repository } = await openRepository();
    await seedShotWithSourceTrack(database);
    await database.insert(tracks).values([
      {
        id: "running-render",
        shotId: "shot",
        projectId: "project",
        name: "Running",
        type: "RENDER",
        position: 3
      },
      {
        id: "other-shot-render",
        shotId: "other-shot",
        projectId: "project",
        name: "Other",
        type: "RENDER",
        position: 0
      }
    ]);
    await insertRenderClip(database, {
      trackId: "older-render",
      assetStatus: "available"
    });
    await insertRenderClip(database, {
      trackId: "deleted-render",
      assetStatus: "available"
    });
    await insertRenderClip(database, {
      trackId: "running-render",
      assetStatus: "processing"
    });
    await insertRenderClip(database, {
      trackId: "other-shot-render",
      assetStatus: "pending",
      assetData: { cloudMirror: true }
    });
    await insertRenderClip(database, {
      trackId: "source",
      assetStatus: "available"
    });

    expect(await repository.list()).toEqual([
      expect.objectContaining({ id: "project", total_renders: 2 })
    ]);
    expect(
      (await repository.listShots("project")).map((shot) => [
        shot.id,
        shot.total_renders
      ])
    ).toEqual([
      ["shot", 1],
      ["other-shot", 1]
    ]);
  });

  test("reports a mirrored cloud render's own queue status while its file is pending", async () => {
    const { database, repository } = await openRepository();
    await seedShotWithSourceTrack(database);
    await insertRenderClip(database, {
      trackId: "older-render",
      assetStatus: "pending",
      assetData: { cloudMirror: true, queue_status: "ERROR" }
    });

    expect(await repository.getAsset("asset-older-render")).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({ queue_status: "ERROR" })
      })
    );
    expect(await repository.list()).toEqual([
      expect.objectContaining({ id: "project", total_renders: 0 })
    ]);
  });

  test("keeps pinned tracks and the project type when settings omit them", async () => {
    const { database, repository } = await openRepository();
    await database.insert(projects).values({
      id: "pinned",
      name: "Pinned",
      settingsJson: JSON.stringify({
        type: "script_to_shots",
        pinnedTrackIds: { shot: "track" },
        folders: []
      })
    });

    const updated = await repository.update({
      projectId: "pinned",
      name: "Renamed",
      description: "",
      settings: { rangeMin: 0 }
    });

    expect(updated.settings).toEqual({
      rangeMin: 0,
      type: "script_to_shots",
      pinnedTrackIds: { shot: "track" },
      origin: "local"
    });
  });

  test("keeps the hidden folder project off the project list", async () => {
    const { database, repository } = await openRepository();
    await database.insert(projects).values([
      {
        id: "folders",
        name: "local",
        description: "Folder dummy project"
      },
      { id: "named-local", name: "local", description: "My film" }
    ]);

    expect((await repository.list()).map((project) => project.id)).toEqual([
      "named-local"
    ]);
    expect(
      (await repository.listAll()).map((project) => project.id).sort()
    ).toEqual(["folders", "named-local"]);
  });
});

const video = (sourcePath: string, name: string) => ({
  sourcePath,
  name,
  durationSeconds: 2,
  fps: 24,
  width: 1920,
  height: 1080,
  frameCount: 48,
  thumbnailDataUrl: "data:image/jpeg;base64,/9j/2Q=="
});
