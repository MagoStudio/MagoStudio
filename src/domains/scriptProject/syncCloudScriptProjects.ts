export const syncCloudScriptProjects = async (): Promise<void> => {};

export const cancelCloudProjectCatalogSync = (): void => {};

export const deferCloudProjectCatalogSync = (): void => {};

export const syncCloudScriptProject = async (
  _projectId: string,
  _timelineId?: string
): Promise<void> => {};

export const syncCloudProject = syncCloudScriptProject;

export const syncCloudProjectMetadata = async (
  _projectId: string
): Promise<void> => {};

export const getCloudProjectSyncStatus = (): boolean => false;

export const getCloudProjectCatalogSyncProgress = (): {
  completed: number;
  total: number;
} | null => null;
export const subscribeCloudProjectCatalogSyncProgress =
  (_listener: () => void): (() => void) =>
  () => {};

export const subscribeCloudProjectSyncStatus =
  (_listener: () => void): (() => void) =>
  () => {};

export const promoteCloudAsset =
  (_assetId: string): (() => void) =>
  () => {};

export const promoteCloudTimeline = (_timelineId: string): void => {};

export const subscribeCloudAssetReady =
  (_listener: (projectId: string, assetId: string) => void): (() => void) =>
  () => {};
