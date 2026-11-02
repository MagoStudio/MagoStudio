import { Img2ImgSchema } from "@home/components/Navbar/Img2ImgModalV2/schemas";
import { extractDefaultVideoSettings } from "@models/video/extractDefaultVideoSettings";
import { BulkRendersRunDraftMasterSettings } from "@store/atoms";

import { resolveBulkRenderingDraftPromptDefault } from "./resolveBulkRenderingDraftPromptDefault";

export interface BulkRenderingMasterPrompts {
  masterImagePrompt: string;
  masterVideoPrompt: string;
}

/** The prompts a Bulk Renders Run actually renders with: the stored value, or the selected
 * model's own default when the user has cleared it.
 *
 * Shared by the draft screen and the launch request so the two cannot disagree — the draft
 * showing a model default on every Shot row while the request sends an empty string is the
 * defect this exists to prevent. */
export const resolveBulkRenderingMasterPrompts = (
  masterSettings: BulkRendersRunDraftMasterSettings
): BulkRenderingMasterPrompts => {
  const modelDefaultImagePrompt = Img2ImgSchema.parse({
    model: masterSettings.imageSettings.model
  }).prompt;

  const modelDefaultVideoPromptValue = extractDefaultVideoSettings(
    masterSettings.videoModel
  ).prompt;
  const modelDefaultVideoPrompt =
    typeof modelDefaultVideoPromptValue === "string"
      ? modelDefaultVideoPromptValue
      : "";

  return {
    masterImagePrompt: resolveBulkRenderingDraftPromptDefault({
      storedPromptValue: masterSettings.imageSettings.prompt,
      modelDefaultPrompt: modelDefaultImagePrompt
    }),
    masterVideoPrompt: resolveBulkRenderingDraftPromptDefault({
      storedPromptValue: masterSettings.videoSettings.prompt,
      modelDefaultPrompt: modelDefaultVideoPrompt
    })
  };
};
