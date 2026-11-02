import { mediaDownloads } from "@domains/asset/mediaDownloads";
/* oxlint-disable custom-react/no-use-effect -- cloud mirroring is an external synchronization process */
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useSyncExternalStore } from "react";

import { getLocalDesktopApi } from "@/platform/localDesktop";
import { queryKeys } from "@/queryKeys";

import {
  deferCloudProjectCatalogSync,
  getCloudProjectSyncStatus,
  promoteCloudTimeline,
  subscribeCloudAssetReady,
  subscribeCloudProjectMetadata,
  subscribeCloudProjectSyncStatus,
  syncCloudProject,
  syncCloudScriptProjects
} from "./syncCloudScriptProjects";

const ASSET_REFRESH_DEBOUNCE_MS = 250;

export const useCloudProjectSync = (
  projectId?: string,
  timelineId?: string
): { isSyncing: boolean } => {
  const queryClient = useQueryClient();
  const isSyncing = useSyncExternalStore(
    subscribeCloudProjectSyncStatus,
    getCloudProjectSyncStatus,
    getCloudProjectSyncStatus
  );

  useEffect(() => {
    if (getLocalDesktopApi().account.mode !== "cloud") return;
    return subscribeCloudAssetReady((_readyProjectId, assetId) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.videoAsset.byId(assetId)
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.imageAsset.byId(assetId)
      });
      void queryClient.invalidateQueries({
        queryKey: ["frame-generate", assetId]
      });
      void queryClient.invalidateQueries({
        queryKey: ["cached-video-preview", assetId]
      });
    });
  }, [queryClient]);

  useEffect(() => {
    const desktop = getLocalDesktopApi();
    if (desktop.account.mode !== "cloud") return;
    let isActive = true;
    let catalogRefreshTimer: ReturnType<typeof setTimeout> | null = null;

    const refreshProjectDetails = async (metadataProjectId: string) => {
      if (!isActive || metadataProjectId !== projectId) return;
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.project.byId(metadataProjectId)
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.timelineList.byProjectId(metadataProjectId)
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.projectState.byProjectId(metadataProjectId)
        }),
        queryClient.invalidateQueries({
          queryKey:
            queryKeys.projectScriptVersions.byProjectId(metadataProjectId)
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.projectCut.byProjectId(metadataProjectId)
        })
      ]);
    };
    const unsubscribeMetadata = subscribeCloudProjectMetadata((syncedId) => {
      void refreshProjectDetails(syncedId);
      if (!projectId && !catalogRefreshTimer) {
        catalogRefreshTimer = setTimeout(() => {
          catalogRefreshTimer = null;
          void queryClient.invalidateQueries({
            queryKey: queryKeys.homepage.all
          });
          void queryClient.invalidateQueries({
            queryKey: queryKeys.projectList.all
          });
          void queryClient.invalidateQueries({
            queryKey: queryKeys.projects.all
          });
        }, ASSET_REFRESH_DEBOUNCE_MS);
      }
    });

    // Media lands one asset at a time. Coalesce a burst of arrivals into one
    // project refresh, but refresh that asset's own queries straight away so
    // its player and thumbnails stop waiting.
    let projectRefreshTimer: ReturnType<typeof setTimeout> | null = null;
    const unsubscribeAssetReady = subscribeCloudAssetReady((readyProjectId) => {
      if (!isActive || readyProjectId !== projectId) return;
      if (projectRefreshTimer) return;
      projectRefreshTimer = setTimeout(() => {
        projectRefreshTimer = null;
        void refreshProjectDetails(readyProjectId);
      }, ASSET_REFRESH_DEBOUNCE_MS);
    });

    const refreshCatalog = async () => {
      await syncCloudScriptProjects();
      if (!isActive) return;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.projectList.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.projects.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.homepage.all })
      ]);
    };

    const refresh = async () => {
      if (!projectId) {
        // The homepage query reads the durable local catalog itself. Start the
        // cloud refresh afterward without making rendering or navigation await
        // it.
        void refreshCatalog();
        return;
      }

      // Project routes read only the selected row. In particular, opening a
      // local-origin project must neither await the global catalog sync nor
      // invalidate and reload the project that is already on disk.
      deferCloudProjectCatalogSync();
      const localProject = await desktop.projects.get(projectId);
      if (!isActive || localProject?.origin === "local") return;

      // A cloud-origin (or not-yet-cached) project remains usable from its local
      // snapshot while its detail refresh proceeds independently.
      void syncCloudProject(projectId).catch((error) => {
        if (isActive) {
          console.warn(`Failed to refresh cloud project ${projectId}`, error);
        }
      });
    };

    void refresh();
    return () => {
      isActive = false;
      unsubscribeMetadata();
      unsubscribeAssetReady();
      if (projectRefreshTimer) clearTimeout(projectRefreshTimer);
      if (catalogRefreshTimer) clearTimeout(catalogRefreshTimer);
      // Navigation demotes the old project; its media continues in idle slots.
    };
  }, [projectId, queryClient]);

  // The opened Shot's media is fetched first. This runs after the effect above
  // in the same commit, and that effect's sync starts asynchronously, so the
  // priority is already set when the first download is chosen.
  /* eslint-disable react-you-might-not-need-an-effect/no-event-handler -- priority hint for an external download queue */
  useEffect(() => {
    mediaDownloads.setForeground(projectId, timelineId);
    if (timelineId) promoteCloudTimeline(timelineId);
  }, [projectId, timelineId]);
  /* eslint-enable react-you-might-not-need-an-effect/no-event-handler */

  return { isSyncing };
};
