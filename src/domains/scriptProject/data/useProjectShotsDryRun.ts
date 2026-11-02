import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import {
  GenerateProjectShotsRequest,
  postGenerateProjectShots
} from "../api/postGenerateProjectShots";

export const useProjectShotsDryRun = (
  projectId: string | null | undefined,
  outputSize: [number, number],
  videoSettings?: Record<string, unknown>,
  sequential?: GenerateProjectShotsRequest["sequential"],
  enabled = true,
  timelineIds?: string[]
) => {
  return useQuery({
    queryKey: [
      ...queryKeys.projectState.shotsDryRun(
        projectId,
        outputSize,
        videoSettings,
        sequential
      ),
      ...(timelineIds ? [timelineIds] : [])
    ],
    queryFn: () =>
      postGenerateProjectShots({
        projectId: projectId!,
        isDryRun: true,
        outputSize,
        videoSettings,
        sequential,
        timelineIds
      }),
    enabled: !!projectId && enabled
  });
};
