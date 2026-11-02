import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, test, vi } from "vitest";

vi.mock("electron", () => ({
  app: {
    isPackaged: false,
    getAppPath: () => process.cwd()
  }
}));

import { DatabaseManager } from "../database/databaseManager";
import { ProjectRepository } from "../database/projectRepository";
import { ScriptProjectSnapshotRepository } from "../database/scriptProjectSnapshotRepository";

import { LocalScriptProjectService } from "./localScriptProjectService";

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

const cloudProjectId = "cloud-script-project";

const cloudProject = {
  id: cloudProjectId,
  name: "Cloud script",
  type: "script_to_shots",
  settings: { shot_engine: "minimax_h3_max" }
};

const cloudState = (shotVersionId: string) => ({
  sheets_timeline_id: "cloud-sheets-timeline",
  keys: [
    {
      token: "mara",
      name: "Mara",
      kind: "character",
      effective_asset_id: "cloud-sheet-asset",
      images: [{ asset_id: "cloud-sheet-asset", url: "mago-media://x/1" }]
    }
  ],
  shots: [
    {
      timeline_id: "cloud-shot-1",
      shot_index: 0,
      versions: [{ id: shotVersionId, asset_id: `${shotVersionId}-asset` }],
      pinned_version_id: shotVersionId
    }
  ]
});

const cloudPlan = {
  id: "cloud-plan-1",
  status: "COMPLETED",
  project_id: cloudProjectId,
  steps: []
};

const openCloudScriptProject = async () => {
  const libraryRoot = await mkdtemp(path.join(tmpdir(), "mago-cloud-script-"));
  temporaryDirectories.push(libraryRoot);
  const manager = new DatabaseManager();
  managers.push(manager);
  await manager.open(libraryRoot);
  const projects = new ProjectRepository(manager, async () => libraryRoot);
  const snapshots = new ScriptProjectSnapshotRepository(
    manager,
    async () => libraryRoot
  );
  const service = new LocalScriptProjectService(
    projects,
    snapshots,
    async () => "http://127.0.0.1:8188"
  );
  await snapshots.put({
    projectId: cloudProjectId,
    project: cloudProject,
    state: cloudState("cloud-version-1"),
    scriptVersions: { versions: [{ version: 1, plan_id: "cloud-plan-1" }] },
    planDetails: { "cloud-plan-1": cloudPlan },
    cut: { shots: [{ timeline_id: "cloud-shot-1", asset_id: "cut-asset" }] }
  });
  return { projects, snapshots, service };
};

describe("cloud script project re-sync", () => {
  test("a cloud script project refuses every local write, so the re-sync's whole-snapshot replace has no local content to drop", async () => {
    const { projects, snapshots, service } = await openCloudScriptProject();
    expect((await projects.get(cloudProjectId))?.origin).toBe("cloud");
    const snapshotBeforeLocalWrites = await snapshots.get(cloudProjectId);
    const cloudPipelineOnly =
      "Cloud projects can only use the Mago Cloud script pipeline";

    await expect(
      service.generateShots({
        projectId: cloudProjectId,
        isDryRun: false,
        videoSettings: { local_h3_steps: 8 }
      })
    ).rejects.toThrow(cloudPipelineOnly);
    await expect(
      service.generateSheets({
        projectId: cloudProjectId,
        isDryRun: false,
        tokens: ["mara"]
      })
    ).rejects.toThrow(cloudPipelineOnly);
    for (const operation of [
      "add-sheet-image",
      "pin-sheet",
      "edit-shot",
      "pin-shot",
      "start-cloud-sheet-render",
      "add-cloud-sheet-render"
    ] as const) {
      await expect(
        service.update({
          projectId: cloudProjectId,
          operation,
          payload: { token: "mara", timelineId: "cloud-shot-1" }
        })
      ).rejects.toThrow(cloudPipelineOnly);
    }
    await expect(
      service.cast({ projectId: cloudProjectId, script: "INT. ROOM - DAY" })
    ).rejects.toThrow(cloudPipelineOnly);
    await expect(
      service.exportCut({ projectId: cloudProjectId, isDryRun: false })
    ).rejects.toThrow(cloudPipelineOnly);
    await expect(service.resumePlan("cloud-plan-1")).rejects.toThrow(
      "This plan runs on Mago Cloud"
    );
    await expect(service.cancelPlan("cloud-plan-1")).rejects.toThrow(
      "This plan runs on Mago Cloud"
    );

    expect(await snapshots.get(cloudProjectId)).toEqual(
      snapshotBeforeLocalWrites
    );
  });

  test("a re-sync makes the snapshot match the cloud state", async () => {
    const { snapshots } = await openCloudScriptProject();

    await snapshots.put({
      projectId: cloudProjectId,
      project: cloudProject,
      state: cloudState("cloud-version-2"),
      planDetails: { "cloud-plan-1": { ...cloudPlan, status: "FAILED" } }
    });

    const resynced = await snapshots.get(cloudProjectId);
    expect(resynced?.state).toEqual(cloudState("cloud-version-2"));
    expect(resynced?.planDetails).toEqual({
      "cloud-plan-1": { ...cloudPlan, status: "FAILED" }
    });
    expect(resynced?.cut).toEqual({
      shots: [{ timeline_id: "cloud-shot-1", asset_id: "cut-asset" }]
    });
  });
});
