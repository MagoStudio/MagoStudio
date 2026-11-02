import { RenderMode } from "@hooks/types";

import { backendApiClient } from "@/lib/backend-api-client";

import {
  DEFAULT_SHEET_IMAGE_FILE_TYPE,
  STORYBOARD_IMAGE_SIZE,
  STORYBOARD_RENDER_QUALITY,
  STORYBOARD_SHEET_NAME
} from "../constants";
import { buildStoryboardSheetToken } from "../utils/buildStoryboardSheetToken";

const STORYBOARD_RENDER_MODEL_WITH_INPUT_IMAGES = "gpt_image_2";
const STORYBOARD_RENDER_MODEL_FROM_TEXT_ONLY = "gpt_image_2_t2i";
const FROZEN_SPEC_WITHOUT_PROJECT_VISUAL_STYLE = {};

export type RenderShotStoryboardRequest = {
  projectId?: string;
  sheetsTimelineId: string;
  shotTimelineId: string;
  prompt: string;
  inputImageAssetIds: string[];
};

export const postShotStoryboardRender = async ({
  sheetsTimelineId,
  shotTimelineId,
  prompt,
  inputImageAssetIds
}: RenderShotStoryboardRequest): Promise<void> => {
  const storyboardSheetToken = buildStoryboardSheetToken(shotTimelineId);
  const [inputImageAssetId, ...referenceImageAssetIds] = inputImageAssetIds;

  await backendApiClient.post(`/assets/img2img/render`, {
    timeline_id: sheetsTimelineId,
    sheet_token: storyboardSheetToken,
    sheet_name: STORYBOARD_SHEET_NAME,
    img_file_type: DEFAULT_SHEET_IMAGE_FILE_TYPE,
    render_model: inputImageAssetId
      ? STORYBOARD_RENDER_MODEL_WITH_INPUT_IMAGES
      : STORYBOARD_RENDER_MODEL_FROM_TEXT_ONLY,
    render_mode: RenderMode.CREDITS,
    spec: FROZEN_SPEC_WITHOUT_PROJECT_VISUAL_STYLE,
    ...(inputImageAssetId ? { source_asset: inputImageAssetId, frame: 0 } : {}),
    settings: {
      prompt,
      width: STORYBOARD_IMAGE_SIZE.width,
      height: STORYBOARD_IMAGE_SIZE.height,
      quality: STORYBOARD_RENDER_QUALITY,
      ...(inputImageAssetId
        ? {
            input_image_id: inputImageAssetId,
            reference_images: referenceImageAssetIds
          }
        : {})
    }
  });
};
