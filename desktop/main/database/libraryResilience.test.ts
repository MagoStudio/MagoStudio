import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { eq } from "drizzle-orm";
import { afterEach, expect, it, vi } from "vitest";

vi.mock("electron", () => ({
  app: { isPackaged: false, getAppPath: () => process.cwd() },
  nativeImage: {
    createFromBuffer: (bytes: Buffer) => ({
      isEmpty: () => bytes.toString() !== "valid image",
      getSize: () => ({ width: 32, height: 32 }),
      toPNG: () => bytes,
      resize: () => ({ toJPEG: () => Buffer.from("thumbnail") })
    })
  }
}));

import { ImageRenderService } from "../imageRenders/imageRenderService";
import { listLibraryIssues } from "../libraryHealth";

import { DatabaseManager } from "./databaseManager";
import { ProjectRepository } from "./projectRepository";
import {
  assets,
  clips,
  imageRenderJobs,
  projects,
  scriptProjectSnapshots,
  shots,
  tracks
} from "./schema";
import { ScriptProjectSnapshotRepository } from "./scriptProjectSnapshotRepository";

const roots: string[] = [];
const managers: DatabaseManager[] = [];
afterEach(async () => {
  managers.splice(0).forEach((manager) => manager.close());
  for (const root of roots.splice(0))
    await rm(root, { recursive: true, force: true });
});
const library = async () => {
  const root = await mkdtemp(path.join(tmpdir(), "mago-resilience-"));
  roots.push(root);
  const manager = new DatabaseManager();
  managers.push(manager);
  await manager.open(root);
  const repository = new ProjectRepository(manager, async () => root);
  return { root, manager, repository };
};

it("keeps a damaged project listed with a warning and refuses to overwrite its saved settings", async () => {
  const { manager, repository } = await library();
  const project = await repository.create({
    name: "Damaged project",
    description: "",
    settings: {}
  });
  await manager
    .get()
    .update(projects)
    .set({ settingsJson: "{broken" })
    .where(eq(projects.id, project.id));
  expect(await repository.list()).toEqual([
    expect.objectContaining({ id: project.id })
  ]);
  expect(listLibraryIssues()).toEqual([
    expect.objectContaining({ projectId: project.id, kind: "project" })
  ]);
  await expect(
    repository.update({
      projectId: project.id,
      name: "Replacement",
      description: "",
      settings: {}
    })
  ).rejects.toThrow("Could not read");
  const [original] = await manager
    .get()
    .select()
    .from(projects)
    .where(eq(projects.id, project.id));
  expect(original.settingsJson).toBe("{broken");
});
it("refuses empty fallback reads and writes for a damaged script snapshot", async () => {
  const { manager, root } = await library();
  const snapshots = new ScriptProjectSnapshotRepository(
    manager,
    async () => root
  );
  await snapshots.put({
    projectId: "script",
    state: { shots: [] },
    metadataOnly: true
  });
  await manager
    .get()
    .update(scriptProjectSnapshots)
    .set({ stateJson: "broken" });
  await expect(snapshots.get("script")).rejects.toThrow("Could not read");
  await expect(
    snapshots.put({
      projectId: "script",
      state: { shots: [] },
      metadataOnly: true
    })
  ).rejects.toThrow("Could not read");
  expect(
    (await manager.get().select().from(scriptProjectSnapshots))[0].stateJson
  ).toBe("broken");
});

const render = async (
  status: string,
  requestJson = '{"settings":{},"referenceImageIds":[],"frame":0}',
  providerRequestId: string | null = null
) => {
  const { root, manager } = await library();
  const database = manager.get();
  await database.insert(projects).values({ id: "project", name: "Project" });
  await database
    .insert(shots)
    .values({ id: "shot", projectId: "project", name: "Shot" });
  await database.insert(tracks).values({
    id: "track",
    projectId: "project",
    shotId: "shot",
    name: "Track",
    type: "image"
  });
  const output = path.join(root, "renders", "images", "job", "output.png");
  await mkdir(path.dirname(output), { recursive: true });
  await database.insert(assets).values({
    id: "asset",
    name: "Render",
    type: "image",
    sourcePath: output,
    status
  });
  await database
    .insert(clips)
    .values({ id: "clip", trackId: "track", assetId: "asset", name: "Clip" });
  await database.insert(imageRenderJobs).values({
    id: "job",
    projectId: "project",
    shotId: "shot",
    trackId: "track",
    clipId: "clip",
    assetId: "asset",
    model: "qwen",
    status,
    requestJson,
    providerRequestId
  });
  const service = new ImageRenderService(
    manager,
    async () => root,
    async () => "http://localhost:8188"
  );
  const job = async () =>
    (await manager.get().select().from(imageRenderJobs))[0];
  return { root, manager, service, output, job };
};
it("recognises an output published before its database completion was committed", async () => {
  const { service, output, job } = await render("INPROGRESS");
  await writeFile(output, "valid image");
  await service.reconcileInterruptedRenders();
  expect((await job()).status).toBe("FINISHED");
  expect(await readFile(output, "utf8")).toBe("valid image");
});
it.each(["missing", "empty", "unreadable"])(
  "marks an interrupted %s output failed instead of leaving it stuck",
  async (kind) => {
    const { service, output, job } = await render("INPROGRESS");
    if (kind !== "missing")
      await writeFile(output, kind === "empty" ? "" : "broken image");
    await service.reconcileInterruptedRenders();
    expect((await job()).status).toBe("ERROR");
  }
);
it("retains a provider request for polling after restart", async () => {
  const { service, job } = await render(
    "INQUEUE",
    '{"settings":{},"referenceImageIds":[],"frame":0}',
    "saved-prompt"
  );
  await service.reconcileInterruptedRenders();
  expect((await job()).status).toBe("INQUEUE");
  expect((await job()).providerRequestId).toBe("saved-prompt");
});
it("marks invalid persisted Comfy request data failed without an endless retry", async () => {
  const { service, job } = await render(
    "INQUEUE",
    "broken json",
    "saved-prompt"
  );
  await service.kick();
  expect((await job()).status).toBe("ERROR");
});
it("shows a damaged job as a failed queue entry instead of rejecting the whole queue", async () => {
  const { service } = await render("INQUEUE", "broken json", "saved-prompt");
  const queue = await service.listQueue();
  expect(queue[0]).toMatchObject({
    id: "job",
    status: "ERROR",
    active: false,
    error: { error_type: "saved_data_error" }
  });
});
it("marks a completed render with a missing file unavailable", async () => {
  const { service, job } = await render("FINISHED");
  await service.reconcileInterruptedRenders();
  expect((await job()).status).toBe("ERROR");
});
