import {
  BulkRendersRunDetailImg2ImgSettings,
  BulkRendersRunDetailShotOverride
} from "@schemas/bulkRendersRun";

export interface BulkRendersRunShotImageSettings {
  prompt: string | undefined;
  model: string | undefined;
  referenceAssetIds: string[];
}

export const resolveBulkRendersRunShotImageSettings = ({
  shotId,
  runImg2ImgSettings,
  shotOverridesById
}: {
  shotId: string;
  runImg2ImgSettings: BulkRendersRunDetailImg2ImgSettings | null | undefined;
  shotOverridesById:
    | Record<string, BulkRendersRunDetailShotOverride>
    | null
    | undefined;
}): BulkRendersRunShotImageSettings => {
  const shotImg2ImgSettings = shotOverridesById?.[shotId]?.img2img_settings;

  return {
    prompt: shotImg2ImgSettings?.prompt ?? runImg2ImgSettings?.prompt,
    model:
      shotImg2ImgSettings?.render_model ?? runImg2ImgSettings?.render_model,
    referenceAssetIds:
      shotImg2ImgSettings?.reference_images ??
      runImg2ImgSettings?.reference_images ??
      []
  };
};
