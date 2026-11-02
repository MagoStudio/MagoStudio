import { ProjectType } from "@schemas/scriptProject";

export const keepProjectsOfType = <TProject extends { type: ProjectType }>(
  projects: TProject[],
  projectType: ProjectType | undefined
): TProject[] =>
  projectType
    ? projects.filter((project) => project.type === projectType)
    : projects;
