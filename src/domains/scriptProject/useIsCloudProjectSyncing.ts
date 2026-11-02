import { useSyncExternalStore } from "react";

import {
  getCloudProjectSyncStatus,
  subscribeCloudProjectSyncStatus
} from "./syncCloudScriptProjects";

export const useIsCloudProjectSyncing = (): boolean =>
  useSyncExternalStore(
    subscribeCloudProjectSyncStatus,
    getCloudProjectSyncStatus,
    getCloudProjectSyncStatus
  );
