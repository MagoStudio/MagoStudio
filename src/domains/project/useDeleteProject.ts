import { ProjectListItem } from "@domains/project/api/fetchProjectList";
import { Project } from "@schemas/project";
import {
  type InfiniteData,
  useMutation,
  useQueryClient
} from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";
import { PaginatedResponse } from "@/schemas/pagination";

import { backendApiClient } from "../../lib/backend-api-client";

const deleteProject = async ({ projectId }: { projectId: Project["id"] }) => {
  if (!window.mago) {
    await backendApiClient.delete(`/projects/${projectId}`);
    return;
  }
  const localProject = await window.mago.projects.get(projectId);
  if (
    localProject?.origin === "cloud" &&
    window.mago.account.mode === "cloud"
  ) {
    await backendApiClient.delete(`/projects/${projectId}`);
  }
  await window.mago.projects.delete(projectId);
};

export const useDeleteProject = (props?: { noInvalidation?: boolean }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { projectId: Project["id"] }) => {
      return deleteProject(params);
    },
    onSuccess: (_, params) => {
      if (props?.noInvalidation) return;
      queryClient.setQueryData(queryKeys.projects.all, (old: Project[]) => {
        return old?.filter((project) => project.id !== params.projectId);
      });

      queryClient.setQueriesData<
        InfiniteData<PaginatedResponse<ProjectListItem>>
      >({ queryKey: queryKeys.projectList.all }, (old) => {
        if (!old) return old;
        const newTotal = Math.max((old.pages[0]?.pagination.total ?? 1) - 1, 0);
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.filter((item) => item.id !== params.projectId),
            pagination: {
              ...page.pagination,
              total: newTotal
            }
          }))
        };
      });

      void queryClient.invalidateQueries({
        queryKey: queryKeys.projectList.all
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.homepage.all });
    }
  });
};
