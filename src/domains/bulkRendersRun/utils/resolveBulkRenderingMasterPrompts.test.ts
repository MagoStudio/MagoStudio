import {
  Img2ImgSchema,
  Img2ImgType
} from "@home/components/Navbar/Img2ImgModalV2/schemas";
import { extractDefaultVideoSettings } from "@models/video/extractDefaultVideoSettings";
import { magoV3_3_0_cnetsRenderModel } from "@models/video/magoV3_3_0_cnetsVideoModel";
import { VideoSettings } from "@models/video/types";
import { BulkRendersRunDraftMasterSettings } from "@store/atoms";
import { describe, expect, it } from "vitest";

import { resolveBulkRenderingMasterPrompts } from "./resolveBulkRenderingMasterPrompts";

const buildImageSettings = (prompt: string): Img2ImgType =>
  Img2ImgSchema.parse({
    model: "gpt_image_2",
    frameType: "video",
    prompt
  });

const buildMasterSettings = ({
  imagePrompt,
  videoPrompt
}: {
  imagePrompt: string;
  videoPrompt: string;
}): BulkRendersRunDraftMasterSettings => ({
  imageSettings: buildImageSettings(imagePrompt),
  videoSettings: { prompt: videoPrompt } as VideoSettings,
  videoModel: magoV3_3_0_cnetsRenderModel,
  frameRange: [0, 48],
  isFullFrameRangePresetSelected: false
});

const MODEL_DEFAULT_IMAGE_PROMPT = Img2ImgSchema.parse({
  model: "gpt_image_2"
}).prompt;

describe("resolveBulkRenderingMasterPrompts", () => {
  it("keeps a prompt the user actually wrote", () => {
    const { masterImagePrompt, masterVideoPrompt } =
      resolveBulkRenderingMasterPrompts(
        buildMasterSettings({
          imagePrompt: "a written image prompt",
          videoPrompt: "a written video prompt"
        })
      );

    expect(masterImagePrompt).toBe("a written image prompt");
    expect(masterVideoPrompt).toBe("a written video prompt");
  });

  /* The whole point: a cleared prompt is what the draft screen shows as the model default, so the
   * request has to send that default rather than the empty string it stored. */
  it("resolves a cleared image prompt to the model's default", () => {
    const { masterImagePrompt } = resolveBulkRenderingMasterPrompts(
      buildMasterSettings({ imagePrompt: "", videoPrompt: "kept" })
    );

    expect(masterImagePrompt).toBe(MODEL_DEFAULT_IMAGE_PROMPT);
    expect(masterImagePrompt).not.toBe("");
  });

  /* This model declares no default video prompt, so a cleared one stays cleared. Pinned because
   * it is the other half of the fallback chain: the resolver must not invent copy where the
   * model offers none. */
  it("leaves a cleared video prompt empty when the model declares no default", () => {
    const { masterVideoPrompt } = resolveBulkRenderingMasterPrompts(
      buildMasterSettings({ imagePrompt: "kept", videoPrompt: "" })
    );

    expect(
      extractDefaultVideoSettings(magoV3_3_0_cnetsRenderModel).prompt
    ).toBe("");
    expect(masterVideoPrompt).toBe("");
  });
});
