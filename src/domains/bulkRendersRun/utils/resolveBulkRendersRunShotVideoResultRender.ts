import {
  BulkRendersRunStep,
  BulkRendersRunVideoResultAssetStepResultSchema
} from "@schemas/bulkRendersRun";

import { VIDEO_CHAIN_TOOL_NAMES } from "./bulkRendersRunToolChains";

export interface BulkRendersRunShotVideoResultRender {
  renderAssetId: string;
  renderFps: number | undefined;
  videoUrl: string | undefined;
  posterUrl: string | undefined;
}

const LOCAL_SCRIPT_MEDIA_PREFIX = "mago-media://script-project/";

const localScriptMediaUrl = (value: string | undefined): string | undefined =>
  value?.startsWith(LOCAL_SCRIPT_MEDIA_PREFIX) ? value : undefined;

const parseStepVideoResultRender = (
  step: BulkRendersRunStep
): BulkRendersRunShotVideoResultRender | undefined => {
  const parsedResult = BulkRendersRunVideoResultAssetStepResultSchema.safeParse(
    step.result
  );
  if (!parsedResult.success) return undefined;

  const videoUrl = localScriptMediaUrl(parsedResult.data.output_url);
  const explicitPosterUrl = localScriptMediaUrl(parsedResult.data.poster_url);
  const posterUrl =
    explicitPosterUrl ??
    (videoUrl && parsedResult.data.poster_asset_id
      ? `${LOCAL_SCRIPT_MEDIA_PREFIX}${parsedResult.data.poster_asset_id}`
      : undefined);

  return {
    renderAssetId: parsedResult.data.render_asset_id,
    renderFps: parsedResult.data.fps,
    videoUrl,
    posterUrl
  };
};

export const resolveBulkRendersRunShotVideoResultRender = (
  shotSteps: BulkRendersRunStep[]
): BulkRendersRunShotVideoResultRender | undefined => {
  const videoResultRendersByStepOrder = shotSteps
    .filter((step) => VIDEO_CHAIN_TOOL_NAMES.has(step.tool_name))
    .sort((first, second) => first.step_order - second.step_order)
    .map(parseStepVideoResultRender)
    .filter(
      (render): render is BulkRendersRunShotVideoResultRender => !!render
    );

  return videoResultRendersByStepOrder.at(-1);
};
