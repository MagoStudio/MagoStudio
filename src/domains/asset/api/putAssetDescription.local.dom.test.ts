import { afterEach, describe, expect, it, vi } from "vitest";

import { backendApiClient } from "@/lib/backend-api-client";

import { putAssetDescription } from "./putAssetDescription";

describe("putAssetDescription (desktop)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(window, "mago");
  });

  const installBridge = (media: unknown) => {
    const update = vi.fn().mockResolvedValue({});
    Object.defineProperty(window, "mago", {
      configurable: true,
      value: {
        scriptProjects: {
          findMedia: vi.fn().mockResolvedValue(media),
          update
        }
      }
    });
    return update;
  };

  it("writes a local sheet image's description into its project", async () => {
    const update = installBridge({
      projectId: "project-1",
      kind: "sheet-image",
      image: {}
    });
    const put = vi.spyOn(backendApiClient, "put");

    await putAssetDescription({ assetId: "asset-1", description: "" });

    expect(update).toHaveBeenCalledWith({
      projectId: "project-1",
      operation: "edit-image-description",
      payload: { assetId: "asset-1", description: "" }
    });
    expect(put).not.toHaveBeenCalled();
  });

  it("sends any other asset to the cloud", async () => {
    installBridge(null);
    const put = vi.spyOn(backendApiClient, "put").mockResolvedValue({});

    await putAssetDescription({ assetId: "asset-1", description: "Hi" });

    expect(put).toHaveBeenCalledWith("/assets/asset-1", { description: "Hi" });
  });
});
