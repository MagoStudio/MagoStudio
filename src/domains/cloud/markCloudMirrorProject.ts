import { backendApiClient } from "@/lib/backend-api-client";
import { getLocalDesktopApi } from "@/platform/localDesktop";

import { isCloudMirrorProjectSettings } from "./isCloudMirrorProjectSettings";
import { toCloudMirrorProjectSettings } from "./toCloudMirrorProjectSettings";

interface CloudProjectDocument {
  name?: unknown;
  description?: string | null;
  settings?: Record<string, unknown> | null;
}

export const markCloudMirrorProject = async ({
  localProjectId,
  cloudProjectId,
  signal
}: {
  localProjectId: string;
  cloudProjectId: string;
  signal: AbortSignal;
}): Promise<void> => {
  const { data: cloudProject } =
    await backendApiClient.get<CloudProjectDocument>(
      `/projects/${cloudProjectId}`,
      { signal }
    );
  const cloudSettings = cloudProject.settings ?? {};
  if (!isCloudMirrorProjectSettings(cloudSettings)) {
    if (typeof cloudProject.name !== "string") {
      throw new Error(`Cloud project ${cloudProjectId} returned no name`);
    }
    await backendApiClient.put(
      `/projects/${cloudProjectId}`,
      {
        name: cloudProject.name,
        description: cloudProject.description ?? "",
        settings: {
          ...cloudSettings,
          ...toCloudMirrorProjectSettings(localProjectId)
        }
      },
      { signal }
    );
  }
  await getLocalDesktopApi().cloud.links.patch({
    kind: "project",
    localId: localProjectId,
    patch: { isCloudProjectMarkedAsMirror: true }
  });
};
