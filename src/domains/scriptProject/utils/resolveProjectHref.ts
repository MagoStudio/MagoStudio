import { Project } from "@schemas/project";

import { buildProjectHrefForType } from "./buildProjectHrefForType";

export const resolveProjectHref = (
  projects: Array<Pick<Project, "id"> & { type?: Project["type"] }> | undefined,
  projectId: string
): string =>
  buildProjectHrefForType(
    projectId,
    projects?.find((project) => project.id === projectId)?.type ?? "timeline"
  );
