import { afterEach, describe, expect, it, vi } from "vitest";

const { post, ensureCloudImageAsset } = vi.hoisted(() => ({
  post: vi.fn(),
  ensureCloudImageAsset: vi.fn()
}));

vi.mock("@/lib/backend-api-client", () => ({
  backendApiClient: { post, get: vi.fn() }
}));
vi.mock("@domains/cloud/mirrorService", () => ({ ensureCloudImageAsset }));

import { postBulkRendersRun } from "./postBulkRendersRun.local";

afterEach(() => vi.clearAllMocks());

describe("postBulkRendersRun (desktop)", () => {
  it("sends uploaded first frames to the cloud under their cloud asset ids", async () => {
    ensureCloudImageAsset.mockImplementation(
      async (_api: unknown, localAssetId: string) => `cloud-${localAssetId}`
    );
    post.mockResolvedValue({ data: { id: "run-1", status: "PENDING" } });

    await postBulkRendersRun({
      project_id: "project-1",
      timeline_ids: ["shot-1"],
      shot_overrides: {
        "shot-1": {
          images: [{ asset_id: "first-frame-1", type: "reference_frame" }]
        }
      }
    });

    expect(ensureCloudImageAsset).toHaveBeenCalledWith(
      expect.anything(),
      "first-frame-1",
      "project-1"
    );
    expect(post).toHaveBeenCalledWith(
      "/agent/plans",
      expect.objectContaining({
        shot_overrides: {
          "shot-1": {
            images: [
              { asset_id: "cloud-first-frame-1", type: "reference_frame" }
            ]
          }
        }
      })
    );
  });
});
