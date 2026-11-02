import { useQuery } from "@tanstack/react-query";

import { isLocalApp } from "@/platform/localDesktop";
import { queryKeys } from "@/queryKeys";

const STATUS_STALE_TIME_MS = 60_000;

/**
 * Whether the local Qwen3-VL captioning path is usable.
 *
 * A cheap /object_info probe against ComfyUI, shared across every consumer via
 * the query cache. It gates the caption queries so that mounting a prompt
 * disclosure does not submit multi-minute VLM jobs into ComfyUI's queue when
 * the node or the weights aren't there — and, because the failure is cached
 * here rather than in each caption query, it doesn't re-probe on every remount.
 *
 * On the cloud build there is nothing to check: the server owns the LLM, so
 * this reports ready without a request.
 */
export const useVlmStatus = () => {
  const enabled = isLocalApp && typeof window !== "undefined" && !!window.mago;

  const query = useQuery({
    queryKey: queryKeys.vlmStatus.all,
    queryFn: () => window.mago.vlm.status(),
    enabled,
    staleTime: STATUS_STALE_TIME_MS,
    retry: false
  });

  return {
    isVlmReady: enabled ? query.data?.ready === true : true,
    /** Still probing — callers should wait rather than assume unavailable. */
    isVlmStatusPending: enabled && query.isPending,
    vlmStatus: query.data ?? null,
    vlmStatusError: query.error
  };
};
