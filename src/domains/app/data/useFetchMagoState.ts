import { MINUTE } from "@constants";
import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import { fetchMagoState } from "../api/fetchMagoState";

const POLL_INTERVAL_MINUTES = 5;

export const useFetchMagoState = () => {
  return useQuery({
    queryKey: queryKeys.magoState.all,
    queryFn: fetchMagoState,
    staleTime: POLL_INTERVAL_MINUTES * MINUTE,
    refetchInterval: POLL_INTERVAL_MINUTES * MINUTE,
    retry: false
  });
};
