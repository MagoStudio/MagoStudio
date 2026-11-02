export const buildSceneStoryboardPath = ({
  projectId,
  sceneTimelineId
}: {
  projectId: string;
  sceneTimelineId: string;
}) => `/projects/${projectId}/shots/${sceneTimelineId}/storyboard`;
