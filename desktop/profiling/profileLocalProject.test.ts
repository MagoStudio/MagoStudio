/** Opt-in, read-only profile. Point MAGO_PROFILE_DATABASE at a COPY of the library
 * database and MAGO_PROFILE_LIBRARY at its media root; select MAGO_PROFILE_PROJECT.
 * Run: npx vitest run desktop/profiling/profileLocalProject.test.ts
 */
import { createHash } from "node:crypto";
import { stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import { expect, test, vi } from "vitest";

vi.mock("electron", () => ({
  app: { isPackaged: false, getAppPath: () => process.cwd() }
}));
vi.mock(
  "../../src/domains/scriptProject/syncCloudScriptProjects.local",
  () => ({ hydrateScriptMedia: vi.fn() })
);

// oxlint-disable-next-line local/no-cross-domain-internal-imports -- opt-in profiler exercises the actual API adapter without mounting React
import { listLocalBulkRendersRuns } from "../../src/domains/bulkRendersRun/api/localBulkRendersRun";
import { readScriptProjectSnapshot } from "../../src/domains/scriptProject/scriptProjectSnapshot.local";
import {
  ProjectStateSchema,
  ScriptVersionListSchema,
  ProjectCutSchema
} from "../../src/schemas/scriptProject";
import type { DatabaseManager } from "../main/database/databaseManager";
import { ProjectRepository } from "../main/database/projectRepository";
import {
  optimizedThumbnailUrl,
  ScriptProjectSnapshotRepository
} from "../main/database/scriptProjectSnapshotRepository";
import { createDrizzleDatabase } from "../main/database/sqliteProxy";
import { LocalScriptProjectService } from "../main/scriptProjects/localScriptProjectService";

test.skipIf(!process.env.MAGO_PROFILE_DATABASE)(
  "profiles an existing local project without writing to the library",
  async () => {
    const sqlite = new DatabaseSync(
      path.resolve(process.env.MAGO_PROFILE_DATABASE!),
      { readOnly: true }
    );
    try {
      const database = createDrizzleDatabase(sqlite);
      const manager = {
        get: () => database,
        isOpen: () => true
      } as DatabaseManager;
      const libraryRoot = process.env.MAGO_PROFILE_LIBRARY!;
      const projectId = process.env.MAGO_PROFILE_PROJECT!;
      expect(libraryRoot).toBeTruthy();
      expect(projectId).toBeTruthy();
      const projects = new ProjectRepository(manager, async () => libraryRoot);
      const snapshots = new ScriptProjectSnapshotRepository(
        manager,
        async () => libraryRoot
      );
      const service = new LocalScriptProjectService(
        projects,
        snapshots,
        async () => {
          throw new Error("Profiling must not contact ComfyUI");
        }
      );
      const stages: Record<string, number[]> = {};
      const time = async <T>(
        name: string,
        task: () => T | Promise<T>
      ): Promise<T> => {
        const start = performance.now();
        try {
          return await task();
        } finally {
          (stages[name] ??= []).push(performance.now() - start);
        }
      };
      const read = snapshots.get.bind(snapshots);
      vi.spyOn(snapshots, "get").mockImplementation((id) =>
        time("repository.get", () => read(id))
      );
      const getPlan = snapshots.getPlan.bind(snapshots);
      vi.spyOn(snapshots, "getPlan").mockImplementation((id) =>
        time("repository.getPlan", () => getPlan(id))
      );
      const getProject = projects.get.bind(projects);
      vi.spyOn(projects, "get").mockImplementation((id) =>
        time("projects.get", () => getProject(id))
      );
      const load = async () => {
        const snapshot = await time("service.getSnapshot", () =>
          service.getSnapshot(projectId)
        );
        expect(snapshot).not.toBeNull();
        return snapshot!;
      };
      const first = await time("firstRead", load);
      for (let i = 0; i < 7; i++) await time("repeatRead", load);
      for (let i = 0; i < 5; i++)
        await time("threeConcurrentReads", () =>
          Promise.all([load(), load(), load()])
        );
      // Exercise the actual renderer helper, with a structured clone standing in
      // for IPC serialization. This is not a browser paint/navigation benchmark.
      const bridgeRead = vi.fn(async () => structuredClone(await load()));
      vi.stubGlobal("window", {
        mago: { scriptProjects: { get: bridgeRead } }
      });
      for (let i = 0; i < 5; i++) {
        bridgeRead.mockClear();
        await time("threeRendererReadsWithClone", () =>
          Promise.all([
            readScriptProjectSnapshot(projectId),
            readScriptProjectSnapshot(projectId),
            readScriptProjectSnapshot(projectId)
          ])
        );
        expect(bridgeRead).toHaveBeenCalledOnce();
      }
      for (let i = 0; i < 7; i++) {
        await time("structuredClone", () => structuredClone(first));
        await time("rendererSchemaValidation", () => {
          if (first.state) ProjectStateSchema.parse(first.state);
          if (first.scriptVersions)
            ScriptVersionListSchema.parse(first.scriptVersions);
          if (first.cut) ProjectCutSchema.parse(first.cut);
        });
      }
      // Compare every returned field against the old reader on the real data,
      // not just schema validity or a small synthetic fixture.
      const raw = sqlite
        .prepare("SELECT * FROM script_project_snapshots WHERE project_id = ?")
        .get(projectId)!;
      const media = sqlite
        .prepare("SELECT * FROM script_project_media WHERE project_id = ?")
        .all(projectId);
      const stable = (value: string) => {
        try {
          const url = new URL(value);
          return url.origin + url.pathname;
        } catch {
          return value;
        }
      };
      const cached = new Map<string, string>();
      await Promise.all(
        media.map(async (entry) => {
          const file = await stat(
            path.join(libraryRoot, String(entry.relative_path))
          ).catch(() => null);
          if (file?.isFile() && file.size > 0 && entry.source_url)
            cached.set(
              stable(String(entry.source_url)),
              `mago-media://script-project/${String(entry.id)}`
            );
        })
      );
      const legacy = Object.fromEntries(
        [
          ["state", "state_json"],
          ["scriptVersions", "script_versions_json"],
          ["planDetails", "plan_details_json"],
          ["cut", "cut_json"]
        ].map(([field, column]) => [
          field,
          raw[column] === null
            ? null
            : JSON.parse(String(raw[column]), (key, value: unknown) => {
                if (
                  !["url", "thumbnail_url", "poster_url"].includes(key) ||
                  typeof value !== "string"
                )
                  return value;
                const localized = cached.get(stable(value)) ?? value;
                return key === "thumbnail_url"
                  ? optimizedThumbnailUrl(localized)
                  : localized;
              })
        ])
      );
      const digest = (value: unknown) =>
        createHash("sha256").update(JSON.stringify(value)).digest("hex");
      expect(digest(await read(projectId))).toBe(digest(legacy));
      const review: Record<string, unknown> = {};
      const planId = Object.keys(first.planDetails ?? {}).at(-1);
      vi.stubGlobal("window", {
        mago: {
          projects: {
            list: () => projects.list(),
            listAll: () => projects.listAll(),
            get: (id: string) => projects.get(id)
          },
          scriptProjects: { get: (id: string) => service.getSnapshot(id) }
        }
      });
      for (const [name, operation] of [
        ["catalog", () => projects.list()],
        ["allProjects", () => projects.listAll()],
        ["planLookup", () => snapshots.getPlan(planId!)],
        ["scopedRenderHistory", () => listLocalBulkRendersRuns(projectId)]
      ] as const) {
        const prepare = vi.spyOn(sqlite, "prepare");
        const result = await time(`review.${name}`, operation);
        review[name] = {
          sqlQueries: prepare.mock.calls.length,
          digest: digest(result)
        };
        prepare.mockRestore();
        for (let i = 0; i < 4; i++) await time(`review.${name}`, operation);
      }
      const report = {
        review,
        snapshotMatchesLegacy: true,
        projectId,
        project: (await projects.get(projectId))?.name,
        bytes: sqlite
          .prepare(
            "SELECT length(state_json) AS state, length(script_versions_json) AS versions, length(plan_details_json) AS plans, length(cut_json) AS cut FROM script_project_snapshots WHERE project_id = ?"
          )
          .get(projectId),
        media: sqlite
          .prepare(
            "SELECT count(*) AS count FROM script_project_media WHERE project_id = ?"
          )
          .get(projectId),
        timings: Object.fromEntries(
          Object.entries(stages).map(([name, samples]) => {
            const sorted = [...samples].sort((a, b) => a - b);
            return [
              name,
              {
                calls: samples.length,
                medianMs: sorted[Math.floor(sorted.length / 2)],
                maxMs: Math.max(...samples),
                samples
              }
            ];
          })
        )
      };
      console.log(JSON.stringify(report, null, 2));
      if (process.env.MAGO_PROFILE_OUTPUT)
        await writeFile(
          process.env.MAGO_PROFILE_OUTPUT,
          JSON.stringify(report, null, 2)
        );
    } finally {
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
      sqlite.close();
    }
  },
  120_000
);
