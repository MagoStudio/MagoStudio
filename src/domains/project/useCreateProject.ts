import { Project } from "@schemas/project";
import { ProjectType } from "@schemas/scriptProject";
import { useToast } from "@store/useToast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useTranslation } from "react-i18next";

import { backendApiClient } from "@/lib/backend-api-client";
import { queryKeys } from "@/queryKeys";

import { ProjectCreationTarget } from "./projectCreationTarget";

const HTTP_TOO_MANY_REQUESTS = 429;

type CreateProjectParams = {
  projectName: string;
  projectDescription: string;
  rangeMin: number;
  rangeMax: number;
  projectType?: ProjectType;
  creationTarget?: ProjectCreationTarget;
};

const createProject = async ({
  projectName,
  projectDescription,
  rangeMin,
  rangeMax,
  projectType
}: CreateProjectParams): Promise<Project> => {
  const response = await backendApiClient.post(`/projects`, {
    name: projectName,
    description: projectDescription,
    ...(projectType ? { type: projectType } : {}),
    settings: {
      rangeMin,
      rangeMax
    }
  });
  const project = response.data;
  return project;
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (params: CreateProjectParams) => {
      return createProject(params);
    },
    onSuccess: (newProject) => {
      queryClient.setQueryData(queryKeys.projects.all, (old: Project[]) => {
        return [...old, newProject];
      });

      void queryClient.invalidateQueries({ queryKey: queryKeys.homepage.all });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.projectList.all
      });
    },
    onError: (error) => {
      const isProjectQuotaReached =
        isAxiosError(error) &&
        error.response?.status === HTTP_TOO_MANY_REQUESTS;
      showToast({
        message: isProjectQuotaReached
          ? t("notifications.project_quota_reached.description")
          : t("notifications.project_create_failed.description")
      });
    }
  });
};
