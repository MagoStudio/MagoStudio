import { useProject } from "@domains/project/useProject";
import { useUpdateProject } from "@domains/project/useUpdateProject";
import {
  ProjectUpdateVariables,
  applyProjectUpdateToCache
} from "@domains/project/utils/applyProjectUpdateToCache";
import { Project } from "@schemas/project";
import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import { buildProjectSettingsPatch } from "./utils/buildProjectSettingsPatch";

/** Every settings write on the Script tab goes through this, not a `project` value captured at
 * render time, so two quick writes cannot race each other back to stale settings. */
export const useSaveProjectSettingsPatch = (projectId: string | undefined) => {
  const { data: project } = useProject(projectId);
  const queryClient = useQueryClient();

  const {
    mutate: updateProject,
    mutateAsync: updateProjectAsync,
    isPending: isSavingProjectSettings
  } = useUpdateProject({
    onMutate: async (variables: ProjectUpdateVariables) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.project.byId(variables.projectId)
      });

      const previousProject = queryClient.getQueryData<Project>(
        queryKeys.project.byId(variables.projectId)
      );

      queryClient.setQueryData(
        queryKeys.project.byId(variables.projectId),
        (oldProject: Project | undefined) =>
          applyProjectUpdateToCache(oldProject, variables)
      );

      return { previousProject };
    },
    onError: (_error, variables, context) => {
      const { previousProject } =
        (context as { previousProject?: Project } | undefined) ?? {};

      queryClient.setQueryData(
        queryKeys.project.byId(variables.projectId),
        previousProject
      );
    }
  });

  const buildUpdateVariables = (
    patch: Partial<Project["settings"]>,
    projectOverride?: Project
  ) => {
    const freshestProject =
      projectOverride ??
      queryClient.getQueryData<Project>(queryKeys.project.byId(projectId)) ??
      project;
    const targetProjectId = projectOverride?.id ?? projectId;
    if (!targetProjectId || !freshestProject) return undefined;

    return {
      projectId: targetProjectId,
      projectName: freshestProject.name,
      projectDescription: freshestProject.description,
      settings: buildProjectSettingsPatch(freshestProject, patch),
      settingsPatch: patch
    };
  };

  const saveProjectSettingsPatch = (
    patch: Partial<Project["settings"]>,
    projectOverride?: Project
  ): void => {
    const variables = buildUpdateVariables(patch, projectOverride);
    if (variables) updateProject(variables);
  };

  const saveProjectSettingsPatchAsync = (
    patch: Partial<Project["settings"]>,
    projectOverride?: Project
  ) => {
    const variables = buildUpdateVariables(patch, projectOverride);
    return variables ? updateProjectAsync(variables) : undefined;
  };

  return {
    project,
    saveProjectSettingsPatch,
    saveProjectSettingsPatchAsync,
    isSavingProjectSettings
  };
};
