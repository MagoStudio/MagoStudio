import { useQuery } from "@tanstack/react-query";

import { getLocalDesktopApi } from "@/platform/localDesktop";
import { isCloudRenderAvailable } from "@/platform/renderTarget";

import { getRenderMetrics, parseRenderMetrics } from "../api/getRenderMetrics";
import { RenderMetricsKind } from "../utils/renderMetricsTypes";

const METRICS_POLL_INTERVAL_MS = 10000;

/** Resolve ownership before routing; local video evaluation also works offline. */
export const useRenderMetrics = (
  assetId: string | null | undefined,
  kind: RenderMetricsKind,
  enabled: boolean
) => {
  const ownership = useQuery({
    queryKey: ["localScriptMedia", assetId] as const,
    queryFn: async () =>
      await getLocalDesktopApi().scriptProjects.findMedia({
        assetId: assetId!
      }),
    enabled: !!assetId && enabled,
    staleTime: Infinity
  });
  return useQuery({
    queryKey: ["renderMetrics", kind, assetId] as const,
    queryFn: async () =>
      ownership.data?.kind === "shot-version"
        ? parseRenderMetrics(
            await getLocalDesktopApi().scriptProjects.getRenderMetrics(
              assetId!
            ),
            kind
          )
        : getRenderMetrics(assetId!, kind),
    enabled:
      !!assetId &&
      enabled &&
      ((ownership.data?.kind === "shot-version" && kind === "video") ||
        (ownership.data === null && isCloudRenderAvailable())),
    retry: false,
    refetchInterval: (query) =>
      query.state.data?.status === "PENDING" ? METRICS_POLL_INTERVAL_MS : false
  });
};
