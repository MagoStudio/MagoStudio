import { writeScriptProjectSnapshot } from "@domains/scriptProject/scriptProjectSnapshot";
import { syncCloudProjectMetadata } from "@domains/scriptProject/syncCloudScriptProjects";
import { Project } from "@schemas/project";
import { ProjectType } from "@schemas/scriptProject";
import { useToast } from "@store/useToast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { backendApiClient } from "@/lib/backend-api-client";
import { queryKeys } from "@/queryKeys";

import { ProjectCreationTarget } from "./projectCreationTarget";
import { isProjectQuotaReachedError } from "./utils/isProjectQuotaReachedError";

export const createProject = async ({
  projectName,
  projectDescription,
  rangeMin,
  rangeMax,
  projectType,
  creationTarget
}: {
  projectName: string;
  projectDescription: string;
  rangeMin: number;
  rangeMax: number;
  projectType?: ProjectType;
  creationTarget?: ProjectCreationTarget;
}): Promise<Project> => {
  const shouldCreateCloudProject =
    creationTarget === "cloud" ||
    (creationTarget === undefined &&
      projectType === "script_to_shots" &&
      !!window.mago &&
      window.mago.account.mode === "cloud");
  if (
    creationTarget === "cloud" &&
    window.mago &&
    window.mago.account.mode !== "cloud"
  ) {
    throw new Error("Mago Cloud is not available");
  }
  if (!window.mago || shouldCreateCloudProject) {
    const response = await backendApiClient.post(`/projects`, {
      name: projectName,
      description: projectDescription,
      ...(projectType ? { type: projectType } : {}),
      settings: { rangeMin, rangeMax }
    });
    const project = response.data as Project;
    if (window.mago && shouldCreateCloudProject) {
      if (projectType === "script_to_shots") {
        await writeScriptProjectSnapshot({
          projectId: project.id,
          project: project as Record<string, unknown>
        });
      } else {
        await syncCloudProjectMetadata(project.id);
      }
    }
    return project;
  }
  const library = await window.mago.library.get();
  if (!library) throw new Error("The local Mago library is unavailable");
  const response = await window.mago.projects.create({
    name: projectName,
    description: projectDescription,
    settings: {
      rangeMin,
      rangeMax,
      ...(projectType ? { type: projectType } : {})
    }
  });
  if (projectType === "script_to_shots") {
    await writeScriptProjectSnapshot({
      projectId: response.id,
      state: {
        project_id: response.id,
        sheets_timeline_id: null,
        keys: [],
        shots: []
      },
      scriptVersions: { active_version: null, versions: [] },
      cut: {
        project_id: response.id,
        shots: [],
        missing: [],
        export: null
      }
    });
  }
  return response as Project;
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (params: {
      projectName: string;
      projectDescription: string;
      rangeMin: number;
      rangeMax: number;
      projectType?: ProjectType;
      creationTarget?: ProjectCreationTarget;
    }) => {
      return createProject(params);
    },
    onSuccess: (newProject) => {
      queryClient.setQueryData(
        queryKeys.projects.all,
        (old: Project[] | undefined) => {
          return [...(old ?? []), newProject];
        }
      );

      void queryClient.invalidateQueries({ queryKey: queryKeys.homepage.all });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.projectList.all
      });
    },
    onError: (error) => {
      if (isProjectQuotaReachedError(error)) {
        showToast({
          message: t("notifications.project_quota_reached.description")
        });
        return;
      }
      showToast({
        message:
          error instanceof Error
            ? error.message
            : t("notifications.project_create_failed.description")
      });
    }
  });
};
