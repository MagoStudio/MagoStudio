import { useMutation } from "@tanstack/react-query";

import { backendApiClient } from "@/lib/backend-api-client";

interface PortalSessionParams {
  type?: string;
}

async function createPortalSession(
  params?: PortalSessionParams
): Promise<string> {
  const queryString = params?.type ? `?type=${params.type}` : "";
  const response = await backendApiClient.post<string>(
    `/portal-session${queryString}`
  );
  return response.data;
}

export function usePortalSession() {
  return useMutation({
    mutationFn: (params?: PortalSessionParams) => {
      return createPortalSession(params);
    },
    onError: (error) => {
      console.error("Failed to create portal session:", error);
    }
  });
}
