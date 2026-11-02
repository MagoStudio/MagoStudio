import { ROUTES } from "@config/constants";
import { resolveProjectTypeFromSearchParam } from "@domains/project/utils/resolveProjectTypeFromSearchParam";
import { ProjectType } from "@schemas/scriptProject";

type SidebarRoute = {
  pathname: string;
  projectTypeSearchParam: string | null;
};

export const resolveSidebarActiveProjectType = ({
  pathname,
  projectTypeSearchParam
}: SidebarRoute): ProjectType | undefined => {
  if (pathname.startsWith(ROUTES.PROJECTS_BY_TYPE)) {
    return resolveProjectTypeFromSearchParam(projectTypeSearchParam);
  }
  if (pathname.startsWith(ROUTES.SCRIPT_PROJECT)) {
    return "script_to_shots";
  }
  if (
    pathname.startsWith(ROUTES.PROJECT) ||
    pathname.startsWith(ROUTES.PROJECT_TIMELINE)
  ) {
    return "timeline";
  }
  return undefined;
};
