import { RenderMode } from "@hooks/types";
import { afterEach, describe, expect, it, vi } from "vitest";

import { backendApiClient } from "@/lib/backend-api-client";

import { postSheetGroupRender } from "./postSheetGroupRender";

vi.mock("@domains/cloud/mirrorService", () => ({
  ensureCloudImageAsset: vi.fn().mockResolvedValue("cloud-reference-1")
}));

describe("postSheetGroupRender (local project)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(window, "mago");
  });

  it("returns the local plan so the UI can track the in-flight image", async () => {
    const result = {
      would_run: ["baker"],
      skipped: [],
      changed: {},
      plan_id: "plan-1"
    };
    const generateSheets = vi.fn().mockResolvedValue(result);
    Object.defineProperty(window, "mago", {
      configurable: true,
      value: {
        account: { mode: "local" },
        projects: {
          get: vi.fn().mockResolvedValue({
            id: "project-1",
            origin: "local",
            type: "script_to_shots"
          })
        },
        scriptProjects: { generateSheets }
      }
    });

    await expect(
      postSheetGroupRender({
        projectId: "project-1",
        timelineId: "sheets-1",
        token: "baker",
        prompt: "A baker in a hand-painted animation style",
        renderModel: "flux2_klein_4b_q8_local",
        renderMode: RenderMode.CREDITS,
        outputSize: [720, 1280],
        referenceAssetIds: ["reference-1"],
        referenceInstruction: "Use the coat and hairstyle"
      })
    ).resolves.toEqual(result);

    expect(generateSheets).toHaveBeenCalledWith({
      projectId: "project-1",
      isDryRun: false,
      outputSize: [720, 1280],
      settings: {
        prompt: "A baker in a hand-painted animation style",
        render_model: "flux2_klein_4b_q8_local"
      },
      tokens: ["baker"],
      referenceAssetIds: ["reference-1"],
      referenceInstruction: "Use the coat and hairstyle"
    });
  });

  it("asks the desktop to create the entity it renders, as the cloud does with sheet_name and sheet_kind", async () => {
    const generateSheets = vi.fn().mockResolvedValue({
      would_run: ["baker"],
      skipped: [],
      changed: {},
      plan_id: "plan-1"
    });
    Object.defineProperty(window, "mago", {
      configurable: true,
      value: {
        account: { mode: "local" },
        projects: {
          get: vi.fn().mockResolvedValue({
            id: "project-1",
            origin: "local",
            type: "script_to_shots"
          })
        },
        scriptProjects: { generateSheets }
      }
    });

    await postSheetGroupRender({
      projectId: "project-1",
      timelineId: "sheets-1",
      token: "baker",
      name: "The Baker",
      kind: "character",
      prompt: "A baker in flour-dusted overalls",
      renderModel: "flux2_klein_4b_q8_local",
      renderMode: RenderMode.CREDITS,
      outputSize: [720, 1280]
    });

    expect(generateSheets).toHaveBeenCalledWith(
      expect.objectContaining({
        tokens: ["baker"],
        sheetGroupToCreate: { name: "The Baker", kind: "character" }
      })
    );
  });

  it("mirrors and sends reference inputs for a cloud project", async () => {
    Object.defineProperty(window, "mago", {
      configurable: true,
      value: {
        account: { mode: "cloud" },
        projects: {
          get: vi.fn().mockResolvedValue({
            id: "project-1",
            origin: "cloud",
            type: "script_to_shots"
          })
        }
      }
    });
    const patch = vi.spyOn(backendApiClient, "patch").mockResolvedValue({
      data: { token: "baker", name: "Baker", layer_id: "layer" }
    });
    const post = vi.spyOn(backendApiClient, "post").mockResolvedValue({
      data: { would_run: ["baker"], skipped: [], changed: {} }
    });

    await postSheetGroupRender({
      projectId: "project-1",
      timelineId: "sheets-1",
      token: "baker",
      prompt: "A baker",
      renderModel: "nanobanana_2_t2i",
      renderMode: RenderMode.CREDITS,
      outputSize: [1280, 720],
      referenceAssetIds: ["local-reference-1"],
      referenceInstruction: "Use the coat and hairstyle"
    });

    expect(patch).toHaveBeenCalledWith(
      "/timelines/sheets-1/sheets/baker/edit",
      {
        reference_asset_ids: ["cloud-reference-1"],
        reference_instruction: "Use the coat and hairstyle"
      }
    );
    expect(post).toHaveBeenCalledWith("/assets/img2img/render", {
      timeline_id: "sheets-1",
      sheet_token: "baker",
      img_file_type: "png",
      render_model: "nanobanana_2",
      render_mode: RenderMode.CREDITS,
      source_asset: "cloud-reference-1",
      frame: 0,
      settings: {
        prompt:
          "A baker\n\nUse the supplied reference images as follows: Use the coat and hairstyle",
        width: 1280,
        height: 720,
        input_image_id: "cloud-reference-1",
        reference_images: []
      }
    });
  });
});
