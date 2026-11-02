import { ROUTES } from "@config/constants";
import { ProjectType } from "@schemas/scriptProject";

export const buildProjectsByTypeHref = (projectType: ProjectType): string =>
  `${ROUTES.PROJECTS_BY_TYPE}?type=${projectType}`;
