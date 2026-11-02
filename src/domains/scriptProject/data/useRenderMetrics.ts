import { useQuery } from "@tanstack/react-query";

import { getRenderMetrics } from "../api/getRenderMetrics";
import { RenderMetricsKind } from "../utils/renderMetricsTypes";

const METRICS_POLL_INTERVAL_MS = 10000;

export const useRenderMetrics = (
  assetId: string | null | undefined,
  kind: RenderMetricsKind,
  enabled: boolean
) => {
  return useQuery({
    queryKey: ["renderMetrics", kind, assetId] as const,
    queryFn: () => getRenderMetrics(assetId!, kind),
    enabled: !!assetId && enabled,
    retry: false,
    refetchInterval: (query) =>
      query.state.data?.status === "PENDING" ? METRICS_POLL_INTERVAL_MS : false
  });
};
