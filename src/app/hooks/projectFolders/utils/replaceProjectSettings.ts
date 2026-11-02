import { Project } from "@schemas/project";

export const replaceProjectSettings = (
  projects: Project[] | undefined,
  projectId: string,
  settings: Project["settings"]
): Project[] | undefined =>
  projects?.map((project) =>
    project.id === projectId ? { ...project, settings } : project
  );
