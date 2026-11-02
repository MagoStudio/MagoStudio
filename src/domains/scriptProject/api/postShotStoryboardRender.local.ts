import { backendApiClient } from "@/lib/backend-api-client";
import { getLocalDesktopApi } from "@/platform/localDesktop";

import { buildStoryboardSheetToken } from "../utils/buildStoryboardSheetToken";

import { postSceneStoryboardGenerate } from "./postSceneStoryboardGenerate";

export type RenderShotStoryboardRequest = {
  projectId?: string;
  sheetsTimelineId: string;
  shotTimelineId: string;
  prompt: string;
  inputImageAssetIds: string[];
};
export const postShotStoryboardRender = async (
  request: RenderShotStoryboardRequest
): Promise<void> => {
  const localProject = request.projectId
    ? await getLocalDesktopApi().projects.get(request.projectId)
    : null;
  if (localProject && localProject.origin !== "cloud") {
    await postSceneStoryboardGenerate({
      projectId: localProject.id,
      sceneTimelineId: request.shotTimelineId
    });
    return;
  }
  const [source, ...references] = request.inputImageAssetIds;
  await backendApiClient.post("/assets/img2img/render", {
    timeline_id: request.sheetsTimelineId,
    sheet_token: buildStoryboardSheetToken(request.shotTimelineId),
    sheet_name: "Storyboard",
    img_file_type: "png",
    render_model: source ? "gpt_image_2" : "gpt_image_2_t2i",
    render_mode: "credits",
    spec: {},
    ...(source ? { source_asset: source, frame: 0 } : {}),
    settings: {
      prompt: request.prompt,
      width: 1536,
      height: 864,
      quality: "medium",
      ...(source
        ? { input_image_id: source, reference_images: references }
        : {})
    }
  });
};
