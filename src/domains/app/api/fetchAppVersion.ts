import { backendApiClient } from "@/lib/backend-api-client";
import { getLocalDesktopApi, isLocalApp } from "@/platform/localDesktop";

interface AppVersionResponse {
  version: string;
}

export const fetchAppVersion = async (): Promise<AppVersionResponse> => {
  if (isLocalApp) {
    return { version: await getLocalDesktopApi().app.version() };
  }

  const response =
    await backendApiClient.get<AppVersionResponse>("/api/version");

  return response.data;
};
