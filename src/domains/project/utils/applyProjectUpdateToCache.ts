import { Project } from "@schemas/project";

export type ProjectUpdateVariables = {
  projectId: string;
  projectName: string;
  projectDescription: string | null;
  settings?: Project["settings"];
};

export const applyProjectUpdateToCache = (
  oldProject: Project | undefined,
  variables: ProjectUpdateVariables
): Project | undefined => {
  if (!oldProject) return undefined;

  return {
    ...oldProject,
    name: variables.projectName,
    description: variables.projectDescription,
    settings: variables.settings ?? oldProject.settings
  };
};
