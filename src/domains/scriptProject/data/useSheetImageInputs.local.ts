import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import { getSheetImageInputs } from "../api/getSheetImageInputs";

/** Not gated on the cloud: a local project's images answer from the desktop,
 * signed in or not (getSheetImageInputs.local decides where to ask). */
export const useSheetImageInputs = (
  clipId: string | null | undefined,
  shouldFetch = true
) => {
  const enabled = shouldFetch && !!clipId;
  const query = useQuery({
    queryKey: queryKeys.sheetImageInputs.byClipId(clipId),
    queryFn: () => getSheetImageInputs(clipId!),
    enabled,
    staleTime: Infinity
  });
  return { ...query, isPending: query.isPending && enabled };
};
