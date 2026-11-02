import { writeScriptProjectSnapshot } from "@domains/scriptProject/scriptProjectSnapshot";
import { syncCloudProjectMetadata } from "@domains/scriptProject/syncCloudScriptProjects";
import { Project, ProjectSchema } from "@schemas/project";

import { backendApiClient } from "@/lib/backend-api-client";

import { buildCloudProjectSettings } from "../utils/buildCloudProjectSettings";
import { ProjectSettingsMergeBase } from "../utils/mergeSettingsPatchWithCloudSettings";

import { fetchCloudProjectSettings } from "./fetchCloudProjectSettings";

export type UpdateProjectParams = {
  projectId: string;
  projectName: string;
  projectDescription: string | null;
  settings?: { [key: string]: any };
  settingsPatch: Record<string, unknown>;
  settingsMergeBase?: ProjectSettingsMergeBase;
};

const resolveCloudPutSettings = async ({
  projectId,
  settings,
  settingsPatch,
  settingsMergeBase
}: UpdateProjectParams) => {
  const isDesktopWritingToCloud = !!window.mago;
  if (!isDesktopWritingToCloud) {
    return { settingsToPut: settings, settingsToCache: settings };
  }
  const settingsToPut = buildCloudProjectSettings(
    await fetchCloudProjectSettings(projectId),
    settingsPatch,
    settingsMergeBase
  );
  const parsedSettings = ProjectSchema.shape.settings.safeParse(settingsToPut);
  return {
    settingsToPut,
    settingsToCache: parsedSettings.success ? parsedSettings.data : settings
  };
};

export const updateProject = async (
  params: UpdateProjectParams
): Promise<Project["settings"] | undefined> => {
  const { projectId, projectName, projectDescription, settings } = params;
  const localProject = window.mago
    ? await window.mago.projects.get(projectId)
    : null;
  if (
    !window.mago ||
    !localProject ||
    (localProject.origin === "cloud" && window.mago.account.mode === "cloud")
  ) {
    const { settingsToPut, settingsToCache } =
      await resolveCloudPutSettings(params);
    const response = await backendApiClient.put(`/projects/${projectId}`, {
      name: projectName,
      description: projectDescription,
      settings: settingsToPut
    });
    if (window.mago && localProject?.type === "script_to_shots") {
      await writeScriptProjectSnapshot({
        projectId,
        project: response.data as Record<string, unknown>
      });
    } else if (window.mago && localProject?.origin === "cloud") {
      await syncCloudProjectMetadata(projectId);
    }
    return settingsToCache as Project["settings"] | undefined;
  }
  const storedLocalProjectSettings =
    (localProject.settings as Record<string, unknown> | undefined) ?? {};
  await window.mago.projects.update({
    projectId,
    name: projectName,
    description: projectDescription ?? "",
    settings:
      localProject.type === "script_to_shots"
        ? {
            ...storedLocalProjectSettings,
            ...(settings ?? {}),
            type: "script_to_shots"
          }
        : (settings ?? storedLocalProjectSettings)
  });
  return settings as Project["settings"] | undefined;
};
