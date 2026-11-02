import { Project } from "@schemas/project";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import { UpdateProjectParams, updateProject } from "./api/updateProject";
import { applyProjectUpdateToCache } from "./utils/applyProjectUpdateToCache";

export const useUpdateProject = ({
  onMutate,
  onError
}: {
  onMutate?: (variables: any) => unknown;
  onError?: (error: unknown, variables: any, context: unknown) => void;
} = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: UpdateProjectParams) => updateProject(params),
    onMutate,
    onError,
    onSuccess: (persistedSettings, variables) => {
      const cachedVariables = {
        ...variables,
        settings: persistedSettings ?? variables.settings
      };
      queryClient.setQueryData(
        queryKeys.project.byId(variables.projectId),
        (oldProject: Project | undefined) =>
          applyProjectUpdateToCache(oldProject, cachedVariables)
      );

      queryClient.setQueryData(
        queryKeys.projects.all,
        (old: Project[] | undefined) => {
          if (!old) return old;
          return old.map((project) =>
            project.id === variables.projectId
              ? (applyProjectUpdateToCache(project, cachedVariables) ?? project)
              : project
          );
        }
      );

      void queryClient.invalidateQueries({ queryKey: queryKeys.homepage.all });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.projectList.all
      });
    }
  });
};
