import { useSyncExternalStore } from "react";

import {
  getCloudProjectCatalogSyncProgress,
  subscribeCloudProjectCatalogSyncProgress
} from "./syncCloudScriptProjects";

export const useCloudProjectCatalogSyncProgress = () =>
  useSyncExternalStore(
    subscribeCloudProjectCatalogSyncProgress,
    getCloudProjectCatalogSyncProgress,
    getCloudProjectCatalogSyncProgress
  );
