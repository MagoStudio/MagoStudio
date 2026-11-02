import { BulkRendersRunShotPromptOverride } from "./buildCreateBulkRendersRunRequest";

export interface BuildBulkRenderingDraftShotPromptOverridesInput {
  imagePromptByShotId: Map<string, string>;
  videoPromptByShotId: Map<string, string>;
  defaultImagePrompt: string;
  defaultVideoPrompt: string;
}

export const buildBulkRenderingDraftShotPromptOverrides = ({
  imagePromptByShotId,
  videoPromptByShotId,
  defaultImagePrompt,
  defaultVideoPrompt
}: BuildBulkRenderingDraftShotPromptOverridesInput): Record<
  string,
  BulkRendersRunShotPromptOverride
> => {
  const shotPromptOverrideById: Record<
    string,
    BulkRendersRunShotPromptOverride
  > = {};
  const touchedShotIds = new Set([
    ...imagePromptByShotId.keys(),
    ...videoPromptByShotId.keys()
  ]);

  for (const shotId of touchedShotIds) {
    const editedImagePrompt = imagePromptByShotId.get(shotId);
    const editedVideoPrompt = videoPromptByShotId.get(shotId);
    const override: BulkRendersRunShotPromptOverride = {};

    if (
      editedImagePrompt !== undefined &&
      editedImagePrompt.trim() !== "" &&
      editedImagePrompt !== defaultImagePrompt
    ) {
      override.imagePrompt = editedImagePrompt;
    }

    if (
      editedVideoPrompt !== undefined &&
      editedVideoPrompt.trim() !== "" &&
      editedVideoPrompt !== defaultVideoPrompt
    ) {
      override.videoPrompt = editedVideoPrompt;
    }

    if (Object.keys(override).length > 0) {
      shotPromptOverrideById[shotId] = override;
    }
  }

  return shotPromptOverrideById;
};
