import { ShotDialogueTurn, ShotTags } from "@schemas/scriptProject";

import { backendApiClient } from "@/lib/backend-api-client";

export type AddProjectShotRequest = {
  projectId: string;
  /** 0-based position in the Shots tab. `null` appends the Shot after the last one. */
  shotIndex: number | null;
  /** Also the Shot's timeline name. `null` lets the backend name it "New shot". */
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
  await backendApiClient.post(`/projects/${projectId}/shots`, {
    shot_index: shotIndex,
    ...(heading === null ? {} : { heading }),
    video_prompt: videoPrompt,
    dialogue,
    tags
  });
};
