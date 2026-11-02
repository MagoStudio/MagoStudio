import { useProject } from "@domains/project/useProject";
import { useQuery } from "@tanstack/react-query";

import { getLocalDesktopApi } from "@/platform/localDesktop";
import { ProviderPreferences } from "@/platform/providerPreferences";
import { isCloudRenderAvailable } from "@/platform/renderTarget";
import { useProviderPreferences } from "@/platform/useProviderPreferences";

import { isSheetRenderModel } from "./utils/isSheetRenderModel";

const PROVIDER_READINESS_INTERVAL_MS = 10_000;

export const canRenderScriptProject = (
  cloudAvailable: boolean,
  preferences: ProviderPreferences
): boolean => cloudAvailable && preferences["mago-cloud"];

export const canRenderLocalScriptProject = (
  comfyAvailable: boolean,
  preferences: ProviderPreferences,
  sheetRenderModel?: unknown,
  cloudAvailable = false
): boolean =>
  isSheetRenderModel(sheetRenderModel)
    ? canRenderScriptProject(cloudAvailable, preferences)
    : comfyAvailable && preferences["local-comfy"];

/** Sheets use their selected model's provider, including cloud models in local projects. */
export const useScriptProjectRenderAccess = (
  projectId?: string,
  sheetRenderModel?: string
): boolean => {
  const preferences = useProviderPreferences();
  const { data: project } = useProject(projectId);
  const needsComfy =
    project?.origin === "local" && !isSheetRenderModel(sheetRenderModel);
  const { data: comfy } = useQuery({
    queryKey: ["local-script-project-render-access", projectId],
    enabled: !!projectId && needsComfy,
    queryFn: () => getLocalDesktopApi().comfy.check(),
    staleTime: PROVIDER_READINESS_INTERVAL_MS,
    refetchInterval: needsComfy ? PROVIDER_READINESS_INTERVAL_MS : false
  });
  if (!project) return false;
  if (project.origin === "local") {
    return canRenderLocalScriptProject(
      comfy?.available ?? false,
      preferences,
      sheetRenderModel,
      isCloudRenderAvailable()
    );
  }
  return canRenderScriptProject(isCloudRenderAvailable(), preferences);
};
