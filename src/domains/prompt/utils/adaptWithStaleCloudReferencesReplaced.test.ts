import { describe, expect, it, vi } from "vitest";

import { adaptWithStaleCloudReferencesReplaced } from "./adaptWithStaleCloudReferencesReplaced";

const DELETED_VIDEO = "2e8d0b59-376e-4c3c-92de-8587f33401a1";
const FRESH_VIDEO = "6b1f2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d";
const IMAGE = "d5416197-e6de-4cf7-895a-351a4f764c29";

const missingReferenceError = (cloudAssetId: string) =>
  new Error(`reference asset ${cloudAssetId} not found`);

describe("adaptWithStaleCloudReferencesReplaced", () => {
  it("adapts on the first try when every reference exists", async () => {
    const markReferenceStale = vi.fn();

    await expect(
      adaptWithStaleCloudReferencesReplaced({
        mirrorReferences: async () => [
          { localAssetId: "local-image", cloudAssetId: IMAGE }
        ],
        adapt: async (cloudAssetIds) => cloudAssetIds,
        markReferenceStale
      })
    ).resolves.toEqual([IMAGE]);
    expect(markReferenceStale).not.toHaveBeenCalled();
  });

  it("marks a reference the cloud no longer has as stale, mirrors again and retries", async () => {
    const markReferenceStale = vi.fn(async () => undefined);
    const mirrorReferences = vi
      .fn()
      .mockResolvedValueOnce([
        { localAssetId: "local-video", cloudAssetId: DELETED_VIDEO },
        { localAssetId: "local-image", cloudAssetId: IMAGE }
      ])
      .mockResolvedValueOnce([
        { localAssetId: "local-video", cloudAssetId: FRESH_VIDEO },
        { localAssetId: "local-image", cloudAssetId: IMAGE }
      ]);
    const adapt = vi.fn(async (cloudAssetIds: string[]) => {
      if (cloudAssetIds.includes(DELETED_VIDEO))
        throw missingReferenceError(DELETED_VIDEO);
      return "adapted";
    });

    await expect(
      adaptWithStaleCloudReferencesReplaced({
        mirrorReferences,
        adapt,
        markReferenceStale
      })
    ).resolves.toBe("adapted");
    expect(markReferenceStale).toHaveBeenCalledExactlyOnceWith("local-video");
    expect(adapt).toHaveBeenLastCalledWith([FRESH_VIDEO, IMAGE]);
  });

  it("gives up when the same reference is still missing after mirroring again", async () => {
    const markReferenceStale = vi.fn(async () => undefined);

    await expect(
      adaptWithStaleCloudReferencesReplaced({
        mirrorReferences: async () => [
          { localAssetId: "local-video", cloudAssetId: DELETED_VIDEO }
        ],
        adapt: async () => {
          throw missingReferenceError(DELETED_VIDEO);
        },
        markReferenceStale
      })
    ).rejects.toThrow(DELETED_VIDEO);
    expect(markReferenceStale).toHaveBeenCalledTimes(1);
  });

  it("rethrows errors that are not about a missing reference", async () => {
    const markReferenceStale = vi.fn();

    await expect(
      adaptWithStaleCloudReferencesReplaced({
        mirrorReferences: async () => [
          { localAssetId: "local-image", cloudAssetId: IMAGE }
        ],
        adapt: async () => {
          throw new Error("Request failed with status code 500");
        },
        markReferenceStale
      })
    ).rejects.toThrow("500");
    expect(markReferenceStale).not.toHaveBeenCalled();
  });
});
