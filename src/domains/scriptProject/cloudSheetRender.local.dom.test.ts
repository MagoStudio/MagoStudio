import { afterEach, describe, expect, it, vi } from "vitest";

const {
  post,
  get,
  ensureCloudImageAsset,
  ensureCloudProject,
  ensureCloudTimeline,
  canRender
} = vi.hoisted(() => ({
  post: vi.fn(),
  get: vi.fn(),
  ensureCloudImageAsset: vi.fn(),
  ensureCloudProject: vi.fn(),
  ensureCloudTimeline: vi.fn(),
  canRender: { value: true }
}));

vi.mock("@/lib/backend-api-client", () => ({
  backendApiClient: { post, get }
}));
vi.mock("@domains/cloud/mirrorService", () => ({
  ensureCloudImageAsset,
  ensureCloudProject,
  ensureCloudTimeline
}));
vi.mock("@platform/renderTarget", () => ({
  isCloudRenderAvailable: () => canRender.value
}));
vi.mock("@/platform/providerPreferences", () => ({
  readProviderPreferences: () => ({ "mago-cloud": true })
}));

import { executeCloudSheetPlan } from "./cloudSheetRender.local";

const target = (overrides: Record<string, unknown> = {}) => ({
  token: "mara",
  name: "Mara",
  kind: "character",
  _local_render_prompt: "Mara, turnaround\n\nPainterly",
  _local_spec: { kind: "sheet", token: "mara", prompt: "Mara, turnaround" },
  _local_reference_asset_ids: [],
  ...overrides
});

const installBridge = (plan: Record<string, unknown>) => {
  const update = vi.fn().mockResolvedValue({});
  vi.stubGlobal("mago", {
    projects: {
      get: vi.fn().mockResolvedValue({ id: "local-1", name: "Drama" })
    },
    scriptProjects: {
      getPlan: vi.fn().mockResolvedValue(plan),
      get: vi.fn().mockResolvedValue({
        state: {
          sheets_timeline_id: "sheets-1",
          keys: [{ token: "mara", effective_asset_id: "master-1" }]
        }
      }),
      update
    }
  });
  return update;
};

const cloudPlan = (
  targets: Record<string, unknown>[],
  steps: Record<string, unknown>[] = []
) => ({
  id: "plan-1",
  project_id: "local-1",
  status: "RUNNING",
  local_executor: "mago-cloud-renderer",
  local_request: {
    outputSize: [1024, 1024],
    settings: { render_model: "seedream_5_pro_t2i" }
  },
  local_targets: targets,
  steps
});

describe("executeCloudSheetPlan", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    canRender.value = true;
  });

  const succeed = () => {
    ensureCloudProject.mockResolvedValue("cloud-project-1");
    ensureCloudTimeline.mockResolvedValue("cloud-sheets-1");
    post.mockResolvedValue({
      data: { clips: [{ id: "clip-1", asset: { id: "cloud-asset-1" } }] }
    });
    get.mockResolvedValue({
      data: {
        render_status: "SUCCESS",
        output_url: "https://cdn.example/mara.png"
      }
    });
  };

  it("renders text-to-image and hands the image back with its spec", async () => {
    succeed();
    const update = installBridge(cloudPlan([target()]));

    await executeCloudSheetPlan("plan-1");

    expect(post).toHaveBeenCalledWith("/assets/img2img/render", {
      timeline_id: "cloud-sheets-1",
      sheet_token: "mara",
      sheet_name: "Mara",
      sheet_kind: "character",
      img_file_type: "png",
      render_model: "seedream_5_pro_t2i",
      render_mode: "credits",
      settings: {
        prompt: "Mara, turnaround\n\nPainterly",
        width: 1024,
        height: 1024
      }
    });
    expect(update.mock.calls.map(([call]) => call.operation)).toEqual([
      "start-cloud-sheet-render",
      "add-cloud-sheet-render"
    ]);
    expect(update.mock.calls[1]![0].payload).toEqual(
      expect.objectContaining({
        planId: "plan-1",
        token: "mara",
        outputUrl: "https://cdn.example/mara.png",
        renderSpec: { kind: "sheet", token: "mara", prompt: "Mara, turnaround" }
      })
    );
  });

  it("renders a variant through the edit sibling, its master first", async () => {
    succeed();
    ensureCloudImageAsset.mockImplementation(
      async (_api: unknown, id: string) => `cloud-${id}`
    );
    const update = installBridge(
      cloudPlan([
        target({
          token: "mara--coat",
          master_token: "mara",
          _local_reference_asset_ids: ["ref-1"]
        })
      ])
    );

    await executeCloudSheetPlan("plan-1");

    expect(post.mock.calls[0]![1]).toEqual(
      expect.objectContaining({
        render_model: "seedream_5_pro",
        source_asset: "cloud-master-1",
        settings: expect.objectContaining({
          input_image_id: "cloud-master-1",
          reference_images: ["cloud-ref-1"]
        })
      })
    );
    expect(update.mock.calls[1]![0].payload.renderSpec).toEqual(
      expect.objectContaining({ master_asset_id: "master-1" })
    );
  });

  it("polls a clip it already submitted instead of paying again", async () => {
    succeed();
    installBridge(
      cloudPlan(
        [target()],
        [
          {
            tool_name: "submit_img2img_batch",
            tool_args: { token: "mara" },
            status: "COMPLETED",
            result: { cloud_clip_id: "clip-0", cloud_asset_id: "asset-0" }
          }
        ]
      )
    );

    await executeCloudSheetPlan("plan-1");

    expect(post).not.toHaveBeenCalled();
    expect(get).toHaveBeenCalledWith("/assets/img2img/status/clip-0");
  });

  it("does not render a key a newer run took over from this plan", async () => {
    succeed();
    installBridge(
      cloudPlan(
        [target()],
        [
          {
            tool_name: "submit_img2img_batch",
            tool_args: { token: "mara" },
            status: "SKIPPED",
            result: { reason: "superseded", superseded_by: "plan-2" }
          },
          {
            tool_name: "poll_img2img_batch",
            tool_args: { token: "mara" },
            status: "SKIPPED",
            result: { reason: "superseded", superseded_by: "plan-2" }
          }
        ]
      )
    );

    await executeCloudSheetPlan("plan-1");

    expect(post).not.toHaveBeenCalled();
    expect(get).not.toHaveBeenCalled();
  });

  it("pauses the plan with the reason when the cloud is not available", async () => {
    canRender.value = false;
    const update = installBridge(cloudPlan([target()]));

    await executeCloudSheetPlan("plan-1");

    expect(update).toHaveBeenCalledWith({
      projectId: "local-1",
      operation: "fail-cloud-sheet-render",
      payload: {
        planId: "plan-1",
        token: "mara",
        message: "Sign in to Mago Cloud to use this image model"
      }
    });
    expect(post).not.toHaveBeenCalled();
  });
});
