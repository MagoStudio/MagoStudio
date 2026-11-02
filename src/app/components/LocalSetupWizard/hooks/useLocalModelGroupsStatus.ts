import { useQuery } from "@tanstack/react-query";

export const LOCAL_MODEL_GROUPS_STATUS_QUERY_KEY = [
  "local-model-groups-status"
] as const;

export const useLocalModelGroupsStatus = ({
  isLocalModelGroupsStatusNeeded,
  refetchIntervalMs = false
}: {
  isLocalModelGroupsStatusNeeded: boolean;
  refetchIntervalMs?: number | false;
}) =>
  useQuery({
    queryKey: LOCAL_MODEL_GROUPS_STATUS_QUERY_KEY,
    queryFn: () => window.mago.localSetup.modelGroupsStatus(),
    enabled:
      isLocalModelGroupsStatusNeeded &&
      typeof window.mago?.localSetup?.modelGroupsStatus === "function",
    retry: false,
    refetchInterval: refetchIntervalMs
  });
