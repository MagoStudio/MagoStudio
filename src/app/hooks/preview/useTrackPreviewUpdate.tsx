/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect for external sync */

import { AssetStatus } from "@schemas/asset";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { queryKeys } from "@/queryKeys";

interface UseTrackPreviewUpdateProps {
  status?: string;
  assetId?: string;
}

interface UseTrackPreviewUpdateResult {
  isPreviewAssetFinished: boolean;
}

export function useTrackPreviewUpdate({
  status,
  assetId
}: UseTrackPreviewUpdateProps): UseTrackPreviewUpdateResult {
  const prevStatusRef = useRef<string | undefined>(status);
  const queryClient = useQueryClient();

  const isPreviewAssetFinished = status === AssetStatus.FINISHED;

  /* eslint-disable react-you-might-not-need-an-effect/no-event-handler -- refetch finished asset on async status transition; not an event handler */
  useEffect(() => {
    if (
      prevStatusRef.current !== AssetStatus.FINISHED &&
      status === AssetStatus.FINISHED &&
      assetId
    ) {
      void queryClient.refetchQueries({
        queryKey: queryKeys.videoAsset.byId(assetId)
      });
    }
    prevStatusRef.current = status;
  }, [status, assetId, queryClient]);
  /* eslint-enable react-you-might-not-need-an-effect/no-event-handler */

  return {
    isPreviewAssetFinished
  };
}
