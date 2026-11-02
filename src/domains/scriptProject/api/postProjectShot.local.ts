import { ShotDialogueTurn, ShotTags } from "@schemas/scriptProject";

import { backendApiClient } from "@/lib/backend-api-client";
import { getLocalDesktopApi } from "@/platform/localDesktop";

import { isLocalScriptProject } from "../projectOrigin";

export type AddProjectShotRequest = {
  projectId: string;
  shotIndex: number | null;
  heading: string | null;
  videoPrompt: string;
  dialogue: ShotDialogueTurn[];
  tags: ShotTags;
};

export const postProjectShot = async ({
  projectId,
  shotIndex,
  heading,
  videoPrompt,
  dialogue,
  tags
}: AddProjectShotRequest): Promise<void> => {
  const addShotBody = {
    shot_index: shotIndex,
    ...(heading === null ? {} : { heading }),
    video_prompt: videoPrompt,
    dialogue,
    tags
  };
  if (await isLocalScriptProject(projectId)) {
    await getLocalDesktopApi().scriptProjects.update({
      projectId,
      operation: "add-shot",
      payload: addShotBody
    });
    return;
  }
  await backendApiClient.post(`/projects/${projectId}/shots`, addShotBody);
};
