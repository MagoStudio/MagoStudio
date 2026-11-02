import { mediaDownloads } from "@domains/asset/mediaDownloads";
import { useAssetDownloadState } from "@domains/asset/useAssetDownloadPriority";
import { QueryClientContext } from "@tanstack/react-query";
import { useContext } from "react";
import { useTranslation } from "react-i18next";

import { queryKeys } from "@/queryKeys";

import { CircularProgress } from "./CircularProgress";

export const AssetDownloadIndicator = ({
  assetId
}: {
  assetId?: string | null;
}) => {
  const queryClient = useContext(QueryClientContext);
  const { t } = useTranslation();
  const state = useAssetDownloadState(assetId);
  if (state === "queued" || state === "downloading") {
    const label = t(
      state === "queued"
        ? "status.waiting_download.label"
        : "status.downloading_asset.label"
    );
    return (
      <div
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
        title={label}
      >
        <CircularProgress size="md" aria-label={label} />
      </div>
    );
  }
  if (state === "failed" && assetId) {
    return (
      <button
        type="button"
        onClick={() => {
          void mediaDownloads
            .retryAsset(assetId)
            .then(() =>
              Promise.all([
                queryClient?.invalidateQueries({
                  queryKey: queryKeys.videoAsset.byId(assetId)
                }),
                queryClient?.invalidateQueries({
                  queryKey: queryKeys.imageAsset.byId(assetId)
                }),
                queryClient?.invalidateQueries({
                  queryKey: ["cached-video-preview", assetId]
                })
              ])
            )
            .catch(() => {});
        }}
        className="pointer-events-auto absolute inset-0 z-10 flex items-center justify-center text-xs text-glyph-secondary bg-surface-primary/80"
      >
        {t("status.retry_download.label")}
      </button>
    );
  }
  return null;
};
