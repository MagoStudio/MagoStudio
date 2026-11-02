import { LoadingIndicator } from "@components/LoadingIndicator";
import { useToast } from "@store/useToast";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

import { MirrorProgress } from "./mirrorService";

type MirrorStep = Parameters<MirrorProgress>[0];

const STEP_MESSAGE_KEYS: Record<Exclude<MirrorStep, "done">, string> = {
  project: "notifications.cloud_sync_project.description",
  timeline: "notifications.cloud_sync_project.description",
  asset: "notifications.cloud_sync_asset.description",
  encoding: "notifications.cloud_sync_encoding.description",
  uploading: "notifications.cloud_sync_uploading.description",
  ingesting: "notifications.cloud_sync_ingesting.description"
};

/**
 * Shows a toast while a local asset is being mirrored to cloud Mago, so the
 * (sometimes multi-second) upload doesn't just look like the app hanging.
 */
export const useCloudSyncProgressToast = () => {
  const { t } = useTranslation();
  const { showToast, updateToast, hideToast } = useToast();
  const toastIdRef = useRef<string | null>(null);

  const dismiss = () => {
    if (toastIdRef.current) {
      hideToast(toastIdRef.current);
      toastIdRef.current = null;
    }
  };

  const onProgress: MirrorProgress = (step) => {
    if (step === "done") {
      dismiss();
      return;
    }

    const message = (
      <div className="flex items-center gap-2">
        <LoadingIndicator className="shrink-0" />
        <span>{t(STEP_MESSAGE_KEYS[step])}</span>
      </div>
    );

    if (toastIdRef.current) {
      updateToast(toastIdRef.current, { message });
    } else {
      toastIdRef.current = showToast({
        message,
        showTimer: false,
        autoDismiss: false
      });
    }
  };

  return { onProgress, dismiss };
};
