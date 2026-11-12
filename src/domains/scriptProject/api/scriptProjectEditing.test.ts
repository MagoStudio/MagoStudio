import { RenderMode } from "@hooks/types";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { backendApiClient } from "@/lib/backend-api-client";

import { patchProjectShot } from "./patchProjectShot";
import { patchSheetGroup } from "./patchSheetGroup";
import { postSheetGroupRender } from "./postSheetGroupRender";

vi.mock("@/lib/backend-api-client", () => ({
  backendApiClient: { patch: vi.fn(), post: vi.fn() }
}));
vi.mock("../projectOrigin", () => ({
  isLocalScriptProject: async () => false
}));
beforeEach(() => vi.clearAllMocks());
describe("script project API contracts", () => {
  it("creates a new entity with references before saving its reference fields", async () => {
    vi.mocked(backendApiClient.post).mockResolvedValue({ data: {} });
    vi.mocked(backendApiClient.patch).mockImplementationOnce(async () => {
      expect(backendApiClient.post).toHaveBeenCalledWith(
        "/assets/img2img/render",
        expect.objectContaining({
          sheet_token: "hero",
          sheet_name: "Hero",
          render_model: "gpt_image_2",
          settings: expect.objectContaining({
            input_image_id: "face",
            reference_images: ["outfit"],
            prompt:
              "Hero portrait\n\nUse the supplied reference images as follows: Keep the face"
          })
        })
      );
      return {
        data: { token: "hero", name: "Hero", layer_id: "layer", images: [] }
      };
    });
    await postSheetGroupRender({
      isNewSheetGroup: true,
      timelineId: "sheets",
      token: "hero",
      name: "Hero",
      kind: "character",
      prompt: "Hero portrait",
      referenceAssetIds: ["face", "outfit"],
      referenceInstruction: "Keep the face",
      renderModel: "gpt_image_2_t2i",
      renderMode: RenderMode.CREDITS,
      outputSize: [1024, 1024]
    });
    expect(backendApiClient.patch).toHaveBeenCalledWith(
      "/timelines/sheets/sheets/hero/edit",
      {
        prompt: "Hero portrait",
        reference_asset_ids: ["face", "outfit"],
        reference_instruction: "Keep the face"
      }
    );
  });
  it("sends structured dialogue and accepts the backend's nullable edit fields", async () => {
    const dialogue = [
      { speaker: "HERO", speaker_token: "hero", line: "Hello", language: null }
    ];
    vi.mocked(backendApiClient.patch).mockResolvedValue({
      data: { timeline_id: "shot", dialogue, tags: null, edited: null }
    });
    await expect(
      patchProjectShot({ projectId: "project", timelineId: "shot", dialogue })
    ).resolves.toMatchObject({ dialogue, tags: null, edited: null });
    expect(backendApiClient.patch).toHaveBeenCalledWith(
      "/projects/project/shots/shot",
      { dialogue }
    );
  });
  it("clears persisted references through the key edit endpoint", async () => {
    vi.mocked(backendApiClient.patch).mockResolvedValue({
      data: {
        token: "hero",
        name: "Hero",
        layer_id: "layer",
        images: [],
        reference_asset_ids: [],
        reference_instruction: null
      }
    });
    await patchSheetGroup({
      timelineId: "sheets",
      token: "hero",
      referenceAssetIds: [],
      referenceInstruction: null
    });
    expect(backendApiClient.patch).toHaveBeenCalledWith(
      "/timelines/sheets/sheets/hero/edit",
      { reference_asset_ids: [], reference_instruction: null }
    );
  });
  it("saves a character's chosen voice as its voice signature, and null detaches it", async () => {
    vi.mocked(backendApiClient.patch).mockResolvedValue({
      data: { token: "hero", name: "Hero", layer_id: "layer", images: [] }
    });
    const voiceSignature = {
      provider: "elevenlabs",
      voice_id: "CwhRBWXzGAHq8TQ4Fs17",
      name: "Roger",
      preview_url: "https://example.com/roger.mp3"
    };
    await patchSheetGroup({
      timelineId: "sheets",
      token: "hero",
      voiceSignature
    });
    await patchSheetGroup({
      timelineId: "sheets",
      token: "hero",
      voiceSignature: null
    });
    expect(backendApiClient.patch).toHaveBeenNthCalledWith(
      1,
      "/timelines/sheets/sheets/hero/edit",
      { voice_signature: voiceSignature }
    );
    expect(backendApiClient.patch).toHaveBeenNthCalledWith(
      2,
      "/timelines/sheets/sheets/hero/edit",
      { voice_signature: null }
    );
  });
  it.each([
    ["seedream_5_pro_t2i", "seedream_5_pro"],
    ["gpt_image_2_t2i", "gpt_image_2"],
    ["nanobanana_2_t2i", "nanobanana_2"]
  ] as const)(
    "rerenders references with %s without stale-input skipping",
    async (renderModel, editModel) => {
      vi.mocked(backendApiClient.patch).mockResolvedValue({
        data: { token: "hero", name: "Hero", layer_id: "layer", images: [] }
      });
      vi.mocked(backendApiClient.post).mockResolvedValue({
        data: { clips: [{ asset: { id: "rendered" } }] }
      });
      const request = {
        timelineId: "sheets",
        token: "hero",
        prompt: "Hero portrait",
        renderModel,
        renderMode: RenderMode.CREDITS,
        outputSize: [1024, 1024] as [number, number],
        referenceAssetIds: ["image", "second"],
        referenceInstruction: "Use the face"
      };
      await postSheetGroupRender(request);
      await postSheetGroupRender(request);
      expect(backendApiClient.patch).toHaveBeenCalledWith(
        "/timelines/sheets/sheets/hero/edit",
        {
          reference_asset_ids: ["image", "second"],
          reference_instruction: "Use the face"
        }
      );
      expect(backendApiClient.post).toHaveBeenCalledTimes(2);
      expect(backendApiClient.post).toHaveBeenCalledWith(
        "/assets/img2img/render",
        expect.objectContaining({
          sheet_token: "hero",
          render_model: editModel,
          source_asset: "image",
          frame: 0,
          settings: {
            prompt:
              "Hero portrait\n\nUse the supplied reference images as follows: Use the face",
            width: 1024,
            height: 1024,
            input_image_id: "image",
            reference_images: ["second"]
          }
        })
      );
    }
  );
  it("renders references with an empty instruction and leaves the prompt as typed", async () => {
    vi.mocked(backendApiClient.patch).mockResolvedValue({
      data: { token: "hero", name: "Hero", layer_id: "layer", images: [] }
    });
    vi.mocked(backendApiClient.post).mockResolvedValue({
      data: { clips: [{ asset: { id: "rendered" } }] }
    });
    await postSheetGroupRender({
      timelineId: "sheets",
      token: "hero",
      prompt: "Hero portrait, face from image 1",
      renderModel: "gpt_image_2_t2i",
      renderMode: RenderMode.CREDITS,
      outputSize: [1024, 1024],
      referenceAssetIds: ["image"],
      referenceInstruction: ""
    });
    expect(backendApiClient.patch).toHaveBeenCalledWith(
      "/timelines/sheets/sheets/hero/edit",
      { reference_asset_ids: ["image"], reference_instruction: "" }
    );
    expect(backendApiClient.post).toHaveBeenCalledWith(
      "/assets/img2img/render",
      expect.objectContaining({
        settings: expect.objectContaining({
          prompt: "Hero portrait, face from image 1"
        })
      })
    );
  });
  it("does not submit a render when saving references fails", async () => {
    vi.mocked(backendApiClient.patch).mockRejectedValue(
      new Error("Invalid reference")
    );
    await expect(
      postSheetGroupRender({
        timelineId: "sheets",
        token: "hero",
        prompt: "Hero portrait",
        renderModel: "gpt_image_2_t2i",
        renderMode: RenderMode.CREDITS,
        outputSize: [1024, 1024],
        referenceAssetIds: ["image"],
        referenceInstruction: "Use the face"
      })
    ).rejects.toThrow("Invalid reference");
    expect(backendApiClient.post).not.toHaveBeenCalled();
  });

  it("keeps plain text-to-image renders on the explicit render endpoint", async () => {
    await postSheetGroupRender({
      timelineId: "sheets",
      token: "hero",
      prompt: "Hero portrait",
      renderModel: "gpt_image_2_t2i",
      renderMode: RenderMode.CREDITS,
      outputSize: [1024, 1024]
    });
    expect(backendApiClient.patch).not.toHaveBeenCalled();
    expect(backendApiClient.post).toHaveBeenCalledWith(
      "/assets/img2img/render",
      expect.objectContaining({
        render_model: "gpt_image_2_t2i",
        settings: { prompt: "Hero portrait", width: 1024, height: 1024 }
      })
    );
  });
});
