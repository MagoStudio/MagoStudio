import { ProjectType } from "@schemas/scriptProject";

import { buildScriptProjectHref } from "./buildScriptProjectHref";

const TIMELINE_PROJECT_ROUTE = "/project";

export const buildProjectHrefForType = (
  projectId: string,
  projectType: ProjectType
): string =>
  projectType === "script_to_shots"
    ? buildScriptProjectHref(projectId)
    : `${TIMELINE_PROJECT_ROUTE}?projectId=${encodeURIComponent(projectId)}`;
