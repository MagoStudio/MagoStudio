import { backendApiClient } from "@/lib/backend-api-client";

import { CloudApi } from "./mirrorService";

export const backendCloudApi = (): CloudApi => ({
  post: async <T>(url: string, body?: unknown): Promise<T> =>
    (await backendApiClient.post<T>(url, body ?? {})).data,
  get: async <T>(url: string): Promise<T> =>
    (await backendApiClient.get<T>(url)).data
});
