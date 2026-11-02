import { collectLocalVideoReferenceImageIds } from "@domains/renders/utils/collectLocalVideoReferenceImageIds";
import {
  PrepareRenderSettingsContext,
  VideoEngine,
  VideoSettings
} from "@models/video/types";
import { modelUsesKeyFrameSlot } from "@models/video/utils/modelUsesKeyFrameSlot";
import { describe, expect, it } from "vitest";

import { generateVideoValidationSchema } from "./generateVideoValidationSchema";
import { wanAnimate22Model } from "./wanAnimate22Model";
import { wanVace21Model } from "./wanVace21Model";

const baseContext: PrepareRenderSettingsContext = {
  inputVideoWidth: 1920,
  inputVideoHeight: 1080,
  frameRange: [0, 40],
  fps: 24,
  sources: []
};

const wanModels = [
  { name: "wanAnimate22Model", model: wanAnimate22Model },
  { name: "wanVace21Model", model: wanVace21Model }
];

const forBackend = (
  model: (typeof wanModels)[number]["model"],
  sources: PrepareRenderSettingsContext["sources"] = []
) =>
  model.formatValuesForBackend!({ max_size: 640 } as VideoSettings, {
    ...baseContext,
    sources
  });

describe.each(wanModels)("$name reference image source", ({ model }) => {
  it("routes the img2img asset through the key-frame slot, so the crop rides along", () => {
    expect(modelUsesKeyFrameSlot(model)).toBe(true);
  });

  it("derives image_ids from a key_frame source", () => {
    const out = forBackend(model, [
      { asset_id: "img2img-uuid", type: "key_frame", index: 0 }
    ]);
    expect(out.image_ids).toEqual(["img2img-uuid"]);
  });

  it("derives image_ids from a reference_frame source", () => {
    const out = forBackend(model, [
      { asset_id: "uploaded-uuid", type: "reference_frame" }
    ]);
    expect(out.image_ids).toEqual(["uploaded-uuid"]);
  });

  it("emits an empty list when no reference source is set", () => {
    expect(forBackend(model, []).image_ids).toEqual([]);
  });

  it("hands the derived id to the local render pipeline", () => {
    const out = forBackend(model, [
      { asset_id: "img2img-uuid", type: "key_frame", index: 0 }
    ]);
    expect(
      collectLocalVideoReferenceImageIds(
        model.name,
        out as Record<string, unknown>
      )
    ).toEqual(["img2img-uuid"]);
  });

  it("exposes the reference through the stylize-and-upload control", () => {
    const referenceSetting = model.settingsGroups
      .flatMap((group) => group.sections)
      .flatMap((section) => section.settings)
      .find((setting) => setting.key === "source_image_slot");
    expect(referenceSetting?.ui).toBe("FileUploaderWithStylizeButton");
  });

  it("blocks the render until a reference image is set", () => {
    const schema = generateVideoValidationSchema(model);
    expect(schema.safeParse({ prompt: "a horse" }).success).toBe(false);
  });

  it("accepts the render once a reference image is set", () => {
    const schema = generateVideoValidationSchema(model);
    const parsed = schema.safeParse({
      prompt: "a horse",
      source_image_slot: "img2img-uuid"
    });
    expect(parsed.success).toBe(true);
  });

  it("no longer exposes a bare multi-image uploader for the reference", () => {
    const uiKeys = model.settingsGroups
      .flatMap((group) => group.sections)
      .flatMap((section) => section.settings)
      .map((setting) => setting.ui);
    expect(uiKeys).not.toContain("MultiImageUploader");
  });
});

describe("wan model engine names", () => {
  it("keeps the engine names stable", () => {
    expect(wanAnimate22Model.name).toBe(VideoEngine.wan_animate_2_2);
    expect(wanVace21Model.name).toBe(VideoEngine.wan_vace_2_1);
  });
});
