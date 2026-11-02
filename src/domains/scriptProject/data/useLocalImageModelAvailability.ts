import { useQuery } from "@tanstack/react-query";

import { getLocalDesktopApi } from "@/platform/localDesktop";

import { installedLocalImageModels } from "../utils/installedLocalImageModels";

const REFRESH_MS = 5000;
export const useLocalImageModelAvailability = (isLocalProject: boolean) => {
  const query = useQuery({
    queryKey: ["local-script-setup"],
    queryFn: () => getLocalDesktopApi().comfy.scriptSetupStatus(),
    enabled: isLocalProject,
    retry: false,
    refetchInterval: isLocalProject ? REFRESH_MS : false
  });
  return installedLocalImageModels(query.data);
};
