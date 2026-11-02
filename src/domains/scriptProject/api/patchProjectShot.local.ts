import {
  EditedShot,
  EditedShotSchema,
  SequentialShotConfig,
  ShotCamera,
  ShotDialogueTurn,
  ShotTags
} from "@schemas/scriptProject";

import { backendApiClient } from "@/lib/backend-api-client";
import { getLocalDesktopApi } from "@/platform/localDesktop";

import { isLocalScriptProject } from "../projectOrigin";

export type EditProjectShotRequest = {
  projectId: string;
  timelineId: string;
  heading?: string;
  videoPrompt?: string | null;
  dialogue?: ShotDialogueTurn[] | null;
  durationSeconds?: number | null;
  tags?: Partial<ShotTags>;
  camera?: ShotCamera | null;
  sequential?: SequentialShotConfig | null;
  isShotHidden?: boolean;
  shotIndex?: number;
  isShotLocked?: boolean;
};

const buildCloudShotEditBody = (request: EditProjectShotRequest) => ({
  ...(request.heading === undefined ? {} : { heading: request.heading }),
  ...(request.videoPrompt === undefined
    ? {}
    : { video_prompt: request.videoPrompt }),
  ...(request.dialogue === undefined ? {} : { dialogue: request.dialogue }),
  ...(request.durationSeconds === undefined
    ? {}
    : { duration_s: request.durationSeconds }),
  ...(request.tags ? { tags: request.tags } : {}),
  ...(request.sequential === undefined
    ? {}
    : { sequential: request.sequential }),
  ...(request.isShotHidden === undefined
    ? {}
    : { hidden: request.isShotHidden }),
  ...(request.shotIndex === undefined ? {} : { shot_index: request.shotIndex }),
  ...(request.isShotLocked === undefined
    ? {}
    : { locked: request.isShotLocked })
});

export const patchProjectShot = async (
  request: EditProjectShotRequest
): Promise<EditedShot> => {
  if (await isLocalScriptProject(request.projectId)) {
    return EditedShotSchema.parse(
      await getLocalDesktopApi().scriptProjects.update({
        projectId: request.projectId,
        operation: "edit-shot",
        // The cloud's PATCH body, so the desktop validates and tracks edits
        // the same way; camera is the one local-only addition.
        payload: {
          timelineId: request.timelineId,
          ...buildCloudShotEditBody(request),
          ...(request.camera === undefined ? {} : { camera: request.camera })
        }
      })
    );
  }
  const cloudEditBody = buildCloudShotEditBody(request);
  if (Object.keys(cloudEditBody).length === 0) {
    throw new Error("This shot edit is not supported on Mago Cloud projects");
  }
  const response = await backendApiClient.patch(
    `/projects/${request.projectId}/shots/${request.timelineId}`,
    cloudEditBody
  );
  return EditedShotSchema.parse(response.data);
};
