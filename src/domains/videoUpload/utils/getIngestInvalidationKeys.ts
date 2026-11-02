import { queryKeys } from "@/queryKeys";

export const getIngestInvalidationKeys = (projectId: string) => [
  queryKeys.project.byId(projectId),
  queryKeys.timelineList.byProjectId(projectId),
  queryKeys.homepage.all,
  queryKeys.projectList.all
];
