"use client";

import { useQueryClient } from "@tanstack/react-query";
/* oxlint-disable custom-react/no-use-effect -- an interval is external state */
import { useEffect } from "react";

import { backendApiClient } from "@/lib/backend-api-client";
import { isLocalApp } from "@/platform/localDesktop";
import { isCloudRenderAvailable } from "@/platform/renderTarget";
import { queryKeys } from "@/queryKeys";

import { pollCloudImageRenders } from "./pollCloudImageRenders";
import { pollCloudRenders } from "./pollCloudRenders";

/**
 * Keeps cloud renders moving while the app is open.
 *
 * Runs once on mount so a render that outlived its window is picked back up, then
 * on an interval. Only mounts work when the desktop app can actually reach cloud
 * Mago: offline, this does nothing and makes no request.
 *
 * A finished or failed job stops being "active" the moment this poll completes
 * it, so it never passes through `useQueue`'s FINISHED-count comparison the way
 * a local render does -- it just disappears from the active list. Without an
 * invalidation here, the timeline and preview only pick up the result after a
 * manual reload.
 */

const POLL_INTERVAL_MS = 5000;

const cloudApi = {
  post: async <T>(url: string, body?: unknown): Promise<T> =>
    (await backendApiClient.post<T>(url, body ?? {})).data,
  get: async <T>(url: string): Promise<T> =>
    (await backendApiClient.get<T>(url)).data
};

export const useCloudRenderWatcher = (): void => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isLocalApp || !isCloudRenderAvailable()) return;

    let cancelled = false;
    let running = false;

    const tick = async () => {
      // Never overlap: a slow download must not start a second pass.
      if (running || cancelled) return;
      running = true;
      try {
        // Separate endpoints, separate pollers: img2img has no project-wide
        // queue the way video does (see pollCloudImageRenders.ts).
        const [videoOutcome, imageOutcome] = await Promise.all([
          pollCloudRenders(cloudApi),
          pollCloudImageRenders(cloudApi)
        ]);
        const finished = videoOutcome.finished + imageOutcome.finished;
        const failed = videoOutcome.failed + imageOutcome.failed;
        if (videoOutcome.checked + imageOutcome.checked > 0) {
          void queryClient.invalidateQueries({ queryKey: queryKeys.queue.all });
        }
        if (finished > 0 || failed > 0) {
          void queryClient.invalidateQueries({
            queryKey: queryKeys.balance.all
          });
          void queryClient.invalidateQueries({
            queryKey: queryKeys.project.all
          });
          void queryClient.invalidateQueries({
            queryKey: queryKeys.timelineList.all
          });
          void queryClient.invalidateQueries({
            queryKey: queryKeys.videoAsset.all
          });
          void queryClient.invalidateQueries({
            queryKey: queryKeys.assetLibraryItems.all
          });
          void queryClient.invalidateQueries({
            queryKey: ["filmstrip-generate"]
          });
        }
      } catch {
        // A failed pass is not worth surfacing; the next tick tries again.
      } finally {
        running = false;
      }
    };

    void tick();
    const timer = setInterval(() => void tick(), POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [queryClient]);
};
