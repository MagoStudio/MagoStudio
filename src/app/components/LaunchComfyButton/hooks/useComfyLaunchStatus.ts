import { useQuery } from "@tanstack/react-query";

export const COMFY_LAUNCH_STATUS_QUERY_KEY = ["comfy-launch-status"];

export const useComfyLaunchStatus = ({
  isComfyLaunchStatusNeeded = true
}: { isComfyLaunchStatusNeeded?: boolean } = {}) =>
  useQuery({
    queryKey: COMFY_LAUNCH_STATUS_QUERY_KEY,
    queryFn: () => window.mago.comfy.check(),
    enabled: isComfyLaunchStatusNeeded,
    refetchInterval: 5000,
    staleTime: 0
  });
