import { RenderMode } from "@hooks/types";
import { minimaxH3LocalModel } from "@models/video/minimaxH3LocalModel";
import { VideoEngine } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { collectLocalVideoReferenceImageIds } from "../utils/collectLocalVideoReferenceImageIds";
import { reconstructLocalVideoReferenceSources } from "../utils/reconstructLocalVideoReferenceSources";

import { buildRenderPayload } from "./buildRenderPayload";

const desktopReferenceImageIds = (
  renderSettings: Record<string, unknown>,
  sources: { asset_id: string; type: "key_frame" | "reference_frame" }[]
) => {
  const wireSettings = buildRenderPayload({
    parentLayerId: "layer-1",
    frameRange: [0, 120],
    inputTrackId: "video-1",
    renderEngine: "magov2",
    renderMode: RenderMode.CREDITS,
    model: minimaxH3LocalModel,
    inputVideoWidth: 1280,
    inputVideoHeight: 720,
    fps: 24,
    sources,
    renderSettings: {
      mago_engine: VideoEngine.minimax_h3_local,
      prompt: "vfx_edit: carry the fire from <Picture 1>",
      ...renderSettings
    }
  }).render_settings.magov2;
  return {
    wireSettings,
    referenceImageIds: collectLocalVideoReferenceImageIds(
      VideoEngine.minimax_h3_local,
      wireSettings
    )
  };
};

describe("MiniMax H3 (Local) — images the desktop receives", () => {
  it("sends the edited frame in VFX edit, where the reference slot is hidden", () => {
    const { wireSettings, referenceImageIds } = desktopReferenceImageIds(
      { vfx_mode: "vfx_edit" },
      [{ asset_id: "edited", type: "key_frame" }]
    );

    expect(referenceImageIds).toEqual(["edited"]);
    expect(wireSettings.vfx_edited_frame_id).toBe("edited");
  });

  it("sends the reference images in Head swap", () => {
    expect(
      desktopReferenceImageIds({ vfx_mode: "head_swap" }, [
        { asset_id: "head", type: "reference_frame" }
      ]).referenceImageIds
    ).toEqual(["head"]);
  });

  it("sends no edited frame outside VFX edit", () => {
    const { wireSettings, referenceImageIds } = desktopReferenceImageIds(
      { vfx_mode: "style_transfer" },
      [
        { asset_id: "style", type: "reference_frame" },
        { asset_id: "edited", type: "key_frame" }
      ]
    );

    expect(referenceImageIds).toEqual(["style"]);
    expect(wireSettings.vfx_edited_frame_id).toBeUndefined();
  });

  it("keeps the edited frame when a VFX edit render is reused", () => {
    const firstRender = desktopReferenceImageIds({ vfx_mode: "vfx_edit" }, [
      { asset_id: "edited", type: "key_frame" }
    ]);
    const reusedSources = reconstructLocalVideoReferenceSources(
      VideoEngine.minimax_h3_local,
      firstRender.wireSettings
    ) as { asset_id: string; type: "key_frame" | "reference_frame" }[];

    const reusedRender = desktopReferenceImageIds(
      { vfx_mode: "vfx_edit" },
      reusedSources
    );

    expect(reusedRender.referenceImageIds).toEqual(["edited"]);
    expect(reusedRender.wireSettings.vfx_edited_frame_id).toBe("edited");
  });
});
