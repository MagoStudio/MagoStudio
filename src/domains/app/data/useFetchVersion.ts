import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import { fetchAppVersion } from "../api/fetchAppVersion";

export function useFetchVersion() {
  return useQuery({
    queryKey: queryKeys.version.all,
    queryFn: fetchAppVersion,
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });
}
