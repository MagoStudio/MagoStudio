import { isCloudRenderAvailable } from "@platform/renderTarget";
import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import { getSheetImageInputs } from "../api/getSheetImageInputs";

export const useSheetImageInputs = (
  clipId: string | null | undefined,
  shouldFetch = true
) => {
  const enabled = shouldFetch && !!clipId && isCloudRenderAvailable();
  const query = useQuery({
    queryKey: queryKeys.sheetImageInputs.byClipId(clipId),
    queryFn: () => getSheetImageInputs(clipId!),
    enabled,
    staleTime: Infinity
  });
  return { ...query, isPending: query.isPending && enabled };
};
