import { afterEach, describe, expect, it, vi } from "vitest";

const { post, ensureCloudImageAsset } = vi.hoisted(() => ({
  post: vi.fn(),
  ensureCloudImageAsset: vi.fn()
}));

vi.mock("@/lib/backend-api-client", () => ({
  backendApiClient: { post, get: vi.fn() }
}));
vi.mock("@domains/cloud/mirrorService", () => ({ ensureCloudImageAsset }));

import { createPlan } from "./createPlan.local";

afterEach(() => vi.clearAllMocks());

describe("createPlan (desktop)", () => {
  it("sends every image the plan references under its cloud asset id", async () => {
    ensureCloudImageAsset.mockImplementation(
      async (_api: unknown, localAssetId: string) => `cloud-${localAssetId}`
    );
    post.mockResolvedValue({ data: { id: "plan-1" } });

    await createPlan({
      project_id: "project-1",
      timeline_ids: ["shot-1", "shot-2"],
      img2img_settings: {
        mask_image_id: "mask-1",
        reference_images: ["reference-1"]
      } as never,
      shot_overrides: {
        "shot-1": {
          images: [{ asset_id: "first-frame-1", type: "reference_frame" }]
        },
        "shot-2": {}
      }
    });

    expect(ensureCloudImageAsset).toHaveBeenCalledWith(
      expect.anything(),
      "first-frame-1",
      "project-1"
    );
    expect(post).toHaveBeenCalledWith("/agent/plans", {
      project_id: "project-1",
      timeline_ids: ["shot-1", "shot-2"],
      img2img_settings: {
        mask_image_id: "cloud-mask-1",
        reference_images: ["cloud-reference-1"]
      },
      shot_overrides: {
        "shot-1": {
          images: [{ asset_id: "cloud-first-frame-1", type: "reference_frame" }]
        },
        "shot-2": {}
      }
    });
  });
});
