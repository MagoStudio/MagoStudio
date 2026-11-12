import type { QueryClient } from "@tanstack/react-query";

/** Refresh mounted settings and mark closed panels stale for their next visit. */
export const refreshModelSettings = async (queryClient: QueryClient) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["local-model-settings"] }),
    queryClient.invalidateQueries({ queryKey: ["model-diagnostics"] })
  ]);
};
