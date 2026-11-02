import { backendApiClient } from "@/lib/backend-api-client";

import { isCloudMirrorProjectSettings } from "./isCloudMirrorProjectSettings";

export const fetchIsCloudMirrorProject = async (
  cloudProjectId: string,
  signal: AbortSignal
): Promise<boolean> => {
  try {
    const { data } = await backendApiClient.get<{ settings?: unknown }>(
      `/projects/${cloudProjectId}`,
      { signal }
    );
    return isCloudMirrorProjectSettings(data?.settings);
  } catch {
    return false;
  }
};
