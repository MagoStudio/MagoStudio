import { afterEach, describe, expect, it, vi } from "vitest";

import { backendApiClient } from "@/lib/backend-api-client";

import { getSheetImageInputs } from "./getSheetImageInputs";

vi.mock("@platform/renderTarget", () => ({
  isCloudRenderAvailable: () => false
}));

const installBridge = (findMedia: ReturnType<typeof vi.fn>) =>
  Object.defineProperty(window, "mago", {
    configurable: true,
    value: { scriptProjects: { findMedia } }
  });

describe("getSheetImageInputs (desktop)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(window, "mago");
  });

  it("answers a local sheet image from its recorded render settings", async () => {
    installBridge(
      vi.fn().mockResolvedValue({
        projectId: "project-1",
        kind: "sheet-image",
        image: {
          url: "mago-media://script-project/a.png",
          thumbnail_url: "mago-media://script-project-thumbnail/a.png",
          render_settings: {
            prompt: "Mara, turnaround",
            render_model: "qwen-image-2512",
            width: 1024,
            height: 1024
          }
        }
      })
    );
    const get = vi.spyOn(backendApiClient, "get");

    await expect(getSheetImageInputs("clip-1")).resolves.toEqual({
      render_status: "COMPLETED",
      output_url: "mago-media://script-project/a.png",
      thumbnail_url: "mago-media://script-project-thumbnail/a.png",
      data: {
        settings: {
          prompt: "Mara, turnaround",
          render_model: "qwen-image-2512",
          width: 1024,
          height: 1024
        }
      }
    });
    expect(get).not.toHaveBeenCalled();
  });

  it("falls back to the recorded prompt on an older image", async () => {
    installBridge(
      vi.fn().mockResolvedValue({
        projectId: "project-1",
        kind: "sheet-image",
        image: { url: "a.png", prompt: "Mara" }
      })
    );
    const inputs = await getSheetImageInputs("clip-1");
    expect(inputs.data?.settings).toEqual({ prompt: "Mara" });
  });

  it("does not ask the cloud about a clip it does not own while signed out", async () => {
    installBridge(vi.fn().mockResolvedValue(null));
    const get = vi.spyOn(backendApiClient, "get");
    await expect(getSheetImageInputs("clip-1")).resolves.toEqual({});
    expect(get).not.toHaveBeenCalled();
  });
});
