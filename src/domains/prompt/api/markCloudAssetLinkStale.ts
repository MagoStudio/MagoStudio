import { getLocalDesktopApi } from "@/platform/localDesktop";

export const markCloudAssetLinkStale = (localAssetId: string): Promise<void> =>
  getLocalDesktopApi().cloud.links.patch({
    kind: "asset",
    localId: localAssetId,
    patch: { status: "stale" }
  });
