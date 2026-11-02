import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import { getSceneStoryboard } from "../api/getSceneStoryboard";
import { isSheetImageRendering } from "../utils/isSheetImageRendering";

const RENDERING_VERSION_POLL_INTERVAL_MS = 3000;

export const useSceneStoryboard = ({
  projectId,
  sceneTimelineId,
  isVersionListOpen
}: {
  projectId: string;
  sceneTimelineId: string;
  isVersionListOpen: boolean;
}) =>
  useQuery({
    queryKey: queryKeys.projectState.sceneStoryboard(
      projectId,
      sceneTimelineId
    ),
    queryFn: () => getSceneStoryboard({ projectId, sceneTimelineId }),
    enabled: isVersionListOpen,
    refetchInterval: (query) =>
      query.state.data?.versions.some(isSheetImageRendering)
        ? RENDERING_VERSION_POLL_INTERVAL_MS
        : false
  });
