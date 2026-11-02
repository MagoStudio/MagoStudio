import { afterEach, describe, expect, it, vi } from "vitest";

import { ComfyScriptProjectClient } from "../comfyScriptProjectClient";
import * as scriptMedia from "../localScriptMedia";
import { LocalScriptProjectService } from "../localScriptProjectService";

import { sceneFingerprint } from "./storyboard";

afterEach(() => vi.restoreAllMocks());

type Row = Record<string, any>;
const setup = () => {
  const stored: Row = {
    state: {
      project_id: "p",
      sheets_timeline_id: "sheets",
      visual_style: "Oil painting",
      output_size: [720, 1280],
      keys: [],
      shots: [
        {
          timeline_id: "scene",
          shot_index: 0,
          sequence_id: 1,
          video_prompt: "[Shot 1] A cat runs.",
          tags: {}
        }
      ]
    },
    cut: { shots: [] },
    planDetails: {}
  };
  let mediaCount = 0;
  const media = () => ({
    id: `media-${++mediaCount}`,
    url: `mago-media://script-project/media-${mediaCount}`,
    isImage: true
  });
  const snapshots = {
    get: async () => structuredClone(stored),
    put: vi.fn(async (input: Row) => {
      Object.assign(stored, input);
    }),
    getPlan: async (id: string) => structuredClone(stored.planDetails[id]),
    putPlan: vi.fn(async (_project: string, id: string, plan: Row) => {
      stored.planDetails[id] = structuredClone(plan);
    }),
    storeGeneratedMedia: vi.fn(async () => media()),
    storeRemoteMedia: vi.fn(async () => media()),
    resolveMediaPath: async () => "C:/template.png"
  };
  const projects = {
    get: async () => ({
      id: "p",
      origin: "local",
      type: "script_to_shots",
      settings: { visual_style: "Oil painting" }
    })
  };
  const service = new LocalScriptProjectService(
    projects as never,
    snapshots as never,
    async () => "http://localhost:8188"
  );
  const update = (
    operation: "storyboard" | "storyboard-generate" | "storyboard-update",
    payload: Row = {}
  ) =>
    service.update({
      projectId: "p",
      operation,
      payload: { timelineId: "scene", ...payload }
    });
  return { stored, snapshots, projects, service, update };
};
describe("local Storyboard service", () => {
  it.each(["cloud", "local"])(
    "retains a completed %s board while another Scene is being prepared",
    async (provider) => {
      const { stored, snapshots, update, service } = setup();
      stored.state.shots.push({
        ...stored.state.shots[0],
        timeline_id: "second",
        sequence_id: 2
      });
      let releaseImage!: (bytes: Buffer) => void;
      const image = new Promise<Buffer>((resolve) => {
        releaseImage = resolve;
      });
      const render = vi
        .spyOn(ComfyScriptProjectClient.prototype, "runImageEdit")
        .mockReturnValue(image);
      const first = await update("storyboard-generate", {
        renderModel:
          provider === "cloud" ? "gpt_image_2_t2i" : "qwen_image_2512_local"
      });
      if (provider === "local")
        await vi.waitFor(() => expect(render).toHaveBeenCalledOnce());
      let releaseWrite!: () => void;
      let markWrite!: () => void;
      const writeStarted = new Promise<void>((resolve) => {
        markWrite = resolve;
      });
      const proceed = new Promise<void>((resolve) => {
        releaseWrite = resolve;
      });
      const normalPut = snapshots.put.getMockImplementation()!;
      snapshots.put.mockImplementation(async (input: Row) => {
        if (
          input.state?.keys.some((key: Row) => key.timeline_id === "second") &&
          !input.state.keys.find((key: Row) => key.timeline_id === "scene")
            ?.images.length
        ) {
          markWrite();
          await proceed;
        }
        await normalPut(input);
      });
      const second = update("storyboard-generate", {
        timelineId: "second",
        renderModel: "gpt_image_2_t2i"
      });
      await writeStarted;
      const completion =
        provider === "cloud"
          ? service.update({
              projectId: "p",
              operation: "add-cloud-sheet-render",
              payload: {
                planId: first.plan_id,
                token:
                  stored.planDetails[String(first.plan_id)].local_targets[0]
                    .token,
                outputUrl: "https://example.com/result.png"
              }
            })
          : Promise.resolve(releaseImage(Buffer.from("png")));
      try {
        await vi.waitFor(() =>
          provider === "cloud"
            ? expect(snapshots.storeRemoteMedia).toHaveBeenCalledOnce()
            : expect(snapshots.storeGeneratedMedia).toHaveBeenCalledTimes(3)
        );
        await new Promise<void>((resolve) => setImmediate(resolve));
      } finally {
        releaseWrite();
      }
      await Promise.all([second, completion]);
      await vi.waitFor(() =>
        expect(stored.planDetails[String(first.plan_id)].status).toBe(
          "COMPLETED"
        )
      );
      expect(
        stored.state.keys.find((key: Row) => key.timeline_id === "scene").images
      ).toHaveLength(1);
      expect(
        stored.state.keys.some((key: Row) => key.timeline_id === "second")
      ).toBe(true);
    }
  );

  it.each([false, true])(
    "plans the reference-grid steps required by a Storyboard (continuity: %s)",
    async (hasContinuity) => {
      const { stored, service } = setup();
      const grid = vi
        .spyOn(scriptMedia, "createReferenceGrid")
        .mockRejectedValue(new Error("Reached reference grid"));
      const keys = Array.from({ length: hasContinuity ? 8 : 9 }, (_, i) => ({
        token: `prop-${i}`,
        name: `Prop ${i}`,
        kind: "prop",
        enabled: true,
        effective_asset_id: `asset-${i}`,
        images: [
          {
            asset_id: `asset-${i}`,
            status: "available",
            description: "A prop.",
            has_description: true
          }
        ]
      }));
      const shot = stored.state.shots[0];
      Object.assign(shot, {
        duration_s: 6,
        missing_references: [],
        tags: { props: keys.map((key) => key.token) },
        references: {
          props: keys.map((key) => ({
            token: key.token,
            asset_id: key.effective_asset_id
          }))
        }
      });
      if (hasContinuity) {
        shot.shot_index = 1;
        shot.sequence_id = 2;
        shot.sequential = { enabled: true, mode: "last_frame" };
        stored.state.shots.unshift({
          timeline_id: "previous",
          shot_index: 0,
          sequence_id: 1,
          video_prompt: "Previous scene."
        });
        stored.cut.shots.push({
          timeline_id: "previous",
          pinned_asset_id: "previous-video",
          versions: [{ asset_id: "previous-video", ready: true }]
        });
      }
      stored.state.keys = [
        ...keys,
        {
          token: "storyboard_scene",
          role: "storyboard",
          timeline_id: "scene",
          images: [
            {
              asset_id: "board",
              status: "available",
              panel_count: 1,
              storyboard_scene_fingerprint: sceneFingerprint(shot, keys)
            }
          ]
        }
      ];
      const result = await service.generateShots({
        projectId: "p",
        isDryRun: false,
        timelineIds: ["scene"]
      });
      await vi.waitFor(() =>
        expect(stored.planDetails[String(result.plan_id)].status).toBe("PAUSED")
      );
      const plan = stored.planDetails[String(result.plan_id)];
      expect(plan.error).toEqual({ message: "Reached reference grid" });
      expect(plan.steps).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            tool_name: "submit_stitch_refs",
            status: "COMPLETED"
          }),
          expect.objectContaining({ tool_name: "poll_stitch_refs" })
        ])
      );
      expect(grid).toHaveBeenCalledOnce();
    }
  );
  it("recovers interrupted jobs after restart and resumes a cloud board without waiting forever", async () => {
    const { update, snapshots, projects, stored } = setup();
    const submitted = await update("storyboard-generate", {
      renderModel: "gpt_image_2_t2i"
    });
    const restarted = new LocalScriptProjectService(
      projects as never,
      snapshots as never,
      async () => "http://localhost:8188"
    );
    expect((await restarted.getSnapshot("p"))?.state?.shots).toMatchObject([
      { storyboard: { status: "failed", last_attempt_failed: true } }
    ]);
    expect(stored.planDetails[String(submitted.plan_id)].status).toBe("PAUSED");
    await restarted.resumePlan(String(submitted.plan_id));
    await vi.waitFor(() =>
      expect(stored.planDetails[String(submitted.plan_id)].status).toBe(
        "RUNNING"
      )
    );
  });
  it("preserves a pin chosen while a new version is rendering and lists a failed attempt", async () => {
    const { update, service, stored } = setup();
    const submit = () =>
      update("storyboard-generate", { renderModel: "gpt_image_2_t2i" });
    const finish = async (id: unknown) =>
      service.update({
        projectId: "p",
        operation: "add-cloud-sheet-render",
        payload: {
          planId: id,
          token: stored.planDetails[String(id)].local_targets[0].token,
          outputUrl: "https://example.com/board.png"
        }
      });
    const first = await submit();
    await finish(first.plan_id);
    const oldId = ((await update("storyboard")).storyboard as Row)
      .effective_asset_id;
    const second = await submit();
    await update("storyboard-update", { selected_asset_id: oldId });
    await finish(second.plan_id);
    expect(await update("storyboard")).toMatchObject({
      storyboard: {
        version_count: 2,
        selected_asset_id: oldId,
        effective_asset_id: oldId
      }
    });
    const third = await submit();
    await service.update({
      projectId: "p",
      operation: "fail-cloud-sheet-render",
      payload: {
        planId: third.plan_id,
        token: stored.planDetails[String(third.plan_id)].local_targets[0].token,
        message: "Provider unavailable"
      }
    });
    const result = (await update("storyboard")).storyboard as Row;
    expect(result).toMatchObject({
      status: "ready",
      last_attempt_failed: true,
      version_count: 3
    });
    expect(result.versions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: "failed", url: null })
      ])
    );
  });
  it("exposes missing state so the frontend uses the desktop backend path", async () => {
    const { service, update } = setup();
    expect((await service.getSnapshot("p"))?.state?.shots).toMatchObject([
      { storyboard: { status: "missing", shot_count: 1 } }
    ]);
    expect(await update("storyboard")).toMatchObject({
      storyboard: { versions: [] }
    });
  });
  it("plans on the Shot timeline, excludes visual style, finishes and pins versions", async () => {
    const { service, stored, update } = setup();
    const submit = await update("storyboard-generate", {
      renderModel: "gpt_image_2_t2i"
    });
    await vi.waitFor(() =>
      expect(stored.planDetails[String(submit.plan_id)].status).toBe("RUNNING")
    );
    const plan = stored.planDetails[String(submit.plan_id)];
    const target = plan.local_targets[0];
    expect(target).toMatchObject({
      timeline_id: "scene",
      role: "storyboard",
      panel_count: 1
    });
    expect(target._local_render_prompt).not.toContain("Oil painting");
    expect(target._local_spec).not.toHaveProperty("visual_style");
    expect(target.layer_id).toEqual(expect.any(String));
    await service.update({
      projectId: "p",
      operation: "add-cloud-sheet-render",
      payload: {
        planId: submit.plan_id,
        token: target.token,
        outputUrl: "https://example.com/board.png"
      }
    });
    const ready = await update("storyboard");
    expect(ready).toMatchObject({
      storyboard: {
        status: "ready",
        version_count: 1,
        panel_count: 1,
        selected_asset_id: null
      }
    });
    const assetId = (ready.storyboard as Row).effective_asset_id;
    expect(
      await update("storyboard-update", {
        selected_asset_id: assetId,
        enabled: false
      })
    ).toMatchObject({
      storyboard: { selected_asset_id: assetId, enabled: false }
    });
    const before = structuredClone(stored);
    await expect(
      update("storyboard-update", {
        selected_asset_id: "unknown",
        enabled: true
      })
    ).rejects.toThrow("version not found");
    expect(stored).toEqual(before);
  });
  it("queues different Scenes and rejects duplicate submission while a cloud board is running", async () => {
    const { update, stored, service } = setup();
    stored.state.shots.push({
      ...stored.state.shots[0],
      timeline_id: "other",
      sequence_id: 2
    });
    const first = await update("storyboard-generate", {
      renderModel: "gpt_image_2_t2i"
    });
    await expect(
      update("storyboard-generate", { renderModel: "gpt_image_2_t2i" })
    ).rejects.toThrow("already generating");
    const second = await update("storyboard-generate", {
      timelineId: "other",
      renderModel: "gpt_image_2_t2i"
    });
    expect(stored.planDetails[String(second.plan_id)].status).toBe("PENDING");
    const target = stored.planDetails[String(first.plan_id)].local_targets[0];
    await service.update({
      projectId: "p",
      operation: "add-cloud-sheet-render",
      payload: {
        planId: first.plan_id,
        token: target.token,
        outputUrl: "https://example.com/board.png"
      }
    });
    await vi.waitFor(() =>
      expect(stored.planDetails[String(second.plan_id)].status).toBe("RUNNING")
    );
  });
  it("renders a local board by editing the desktop template without requesting an entity caption", async () => {
    const run = vi
      .spyOn(ComfyScriptProjectClient.prototype, "runImageEdit")
      .mockResolvedValue(Buffer.from("png"));
    const { update, stored } = setup();
    await update("storyboard-generate", {
      renderModel: "qwen_image_2512_local"
    });
    await vi.waitFor(() =>
      expect(Object.values(stored.planDetails)[0]).toMatchObject({
        status: "COMPLETED"
      })
    );
    expect(run).toHaveBeenCalledWith(
      expect.objectContaining({
        sourcePath: "C:/template.png",
        outputSize: [1536, 864],
        model: "qwen_image_2512_local"
      })
    );
    expect(await update("storyboard")).toMatchObject({
      storyboard: { status: "ready" }
    });
    run.mockRestore();
  });
  it.each(["locked", "empty", "too-many"])(
    "refuses %s Scenes without persisting a board",
    async (kind) => {
      const { update, stored, snapshots } = setup();
      if (kind === "locked") stored.state.shots[0].locked = true;
      else
        stored.state.shots[0].video_prompt =
          kind === "empty"
            ? ""
            : Array.from({ length: 16 }, (_, i) => `[Shot ${i + 1}] Cut.`).join(
                "\n"
              );
      await expect(update("storyboard-generate")).rejects.toThrow();
      expect(snapshots.put).not.toHaveBeenCalled();
    }
  );
});
