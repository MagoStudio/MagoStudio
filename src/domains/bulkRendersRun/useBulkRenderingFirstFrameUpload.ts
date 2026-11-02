import {
  DEFAULT_ACCEPTED_IMAGE_FILE_TYPES,
  filterFilesByAcceptedType
} from "@components/FileDropZone/filterFilesByAcceptedType";
import { useUploadReferenceImage } from "@domains/asset/useUploadReferenceImage";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { bulkRenderingFlowAtom } from "@store/atoms";
import { getImageDimensions } from "@utils";
import {
  getImageLimitErrorKey,
  IMAGE_UPLOAD_LIMITS
} from "@utils/image/imageUploadLimits";
import { useSetAtom } from "jotai";
import { useRef, useState } from "react";
import { useInterval } from "usehooks-ts";

import { assignBulkRenderingUploadedFirstFrames } from "./utils/assignBulkRenderingUploadedFirstFrames";
import { formatBulkRendersRunElapsedTime } from "./utils/formatBulkRendersRunElapsedTime";

export type BulkRenderingFirstFrameUploadRowStatus =
  | { kind: "linked"; shotName: string }
  | { kind: "unlinkedToAnyShot" }
  | { kind: "uploadFailed" }
  | { kind: "uploading"; elapsedTimeLabel: string; progressPercent: number }
  | { kind: "notStarted" };

export interface BulkRenderingFirstFrameUploadItem {
  id: string;
  fileName: string;
  status: BulkRenderingFirstFrameUploadRowStatus;
}

interface QueuedUpload {
  queueId: string;
  file: File;
  shotId: string | undefined;
}

const TERMINAL_STATUS_KINDS = new Set([
  "linked",
  "unlinkedToAnyShot",
  "uploadFailed"
]);

const ELAPSED_TIME_TICK_MS = 1000;

const buildInitialElapsedTimeLabel = () =>
  formatBulkRendersRunElapsedTime({
    startedAt: new Date().toISOString(),
    now: new Date()
  }) as string;

export const useBulkRenderingFirstFrameUpload = ({
  shots
}: {
  shots: Array<{ id: string; name: string }>;
}) => {
  const setBulkRenderingFlow = useSetAtom(bulkRenderingFlowAtom);
  const selectedProjectId = useSelectedProjectId();
  const { mutateAsync: uploadReferenceImage } = useUploadReferenceImage();

  const [fileNameById, setFileNameById] = useState<Record<string, string>>({});
  const [statusById, setStatusById] = useState<
    Record<string, BulkRenderingFirstFrameUploadRowStatus>
  >({});
  const [itemOrder, setItemOrder] = useState<string[]>([]);
  const [currentUploadId, setCurrentUploadId] = useState<string | undefined>(
    undefined
  );
  const [currentUploadStartedAt, setCurrentUploadStartedAt] = useState<
    string | undefined
  >(undefined);
  const [, setElapsedTimeTick] = useState(0);
  const [hasCompletedAnyUploadBatch, setHasCompletedAnyUploadBatch] =
    useState(false);
  const dismissedUploadIdsRef = useRef<Set<string>>(new Set());
  const activeBatchIdRef = useRef<string | undefined>(undefined);
  const currentUploadAbortControllerRef = useRef<AbortController | undefined>(
    undefined
  );

  useInterval(
    () => setElapsedTimeTick((tick) => tick + 1),
    currentUploadId ? ELAPSED_TIME_TICK_MS : null
  );

  const setShotUploadedFirstFrameAssetId = (shotId: string, assetId: string) =>
    setBulkRenderingFlow((currentFlow) => {
      if (currentFlow?.view !== "draft") return currentFlow;

      return {
        ...currentFlow,
        uploadedFirstFrameAssetIdByShotId: {
          ...currentFlow.uploadedFirstFrameAssetIdByShotId,
          [shotId]: assetId
        }
      };
    });

  const setItemStatus = (
    uploadId: string,
    status: BulkRenderingFirstFrameUploadRowStatus
  ) => setStatusById((current) => ({ ...current, [uploadId]: status }));

  const setItemUploadProgress = (uploadId: string, progressPercent: number) =>
    setStatusById((current) => {
      const existingStatus = current[uploadId];
      if (existingStatus?.kind !== "uploading") return current;
      return {
        ...current,
        [uploadId]: { ...existingStatus, progressPercent }
      };
    });

  const removeNonTerminalItems = () =>
    setItemOrder((current) =>
      current.filter((id) => TERMINAL_STATUS_KINDS.has(statusById[id]?.kind))
    );

  const stopActiveBatch = () => {
    currentUploadAbortControllerRef.current?.abort();
    currentUploadAbortControllerRef.current = undefined;
    activeBatchIdRef.current = undefined;
    removeNonTerminalItems();
    setCurrentUploadId(undefined);
    setCurrentUploadStartedAt(undefined);
  };

  const processQueue = async (queue: QueuedUpload[], batchId: string) => {
    for (const queuedUpload of queue) {
      if (activeBatchIdRef.current !== batchId) return;
      if (dismissedUploadIdsRef.current.has(queuedUpload.queueId)) continue;

      setCurrentUploadId(queuedUpload.queueId);
      setCurrentUploadStartedAt(new Date().toISOString());
      setItemStatus(queuedUpload.queueId, {
        kind: "uploading",
        elapsedTimeLabel: buildInitialElapsedTimeLabel(),
        progressPercent: 0
      });

      const limitErrorKey = await (async () => {
        try {
          const dimensions = await getImageDimensions(queuedUpload.file);
          return getImageLimitErrorKey(
            queuedUpload.file,
            dimensions,
            IMAGE_UPLOAD_LIMITS
          );
        } catch {
          return "upload_button_image_input_too_big" as const;
        }
      })();

      if (activeBatchIdRef.current !== batchId) return;
      if (dismissedUploadIdsRef.current.has(queuedUpload.queueId)) continue;

      if (limitErrorKey) {
        setItemStatus(queuedUpload.queueId, { kind: "uploadFailed" });
        continue;
      }

      if (!selectedProjectId) {
        setItemStatus(queuedUpload.queueId, { kind: "uploadFailed" });
        continue;
      }

      const abortController = new AbortController();
      currentUploadAbortControllerRef.current = abortController;

      try {
        const assetId = await uploadReferenceImage({
          file: queuedUpload.file,
          projectId: selectedProjectId,
          signal: abortController.signal,
          onProgress: (progressPercent) => {
            if (activeBatchIdRef.current !== batchId) return;
            if (dismissedUploadIdsRef.current.has(queuedUpload.queueId)) {
              return;
            }
            setItemUploadProgress(queuedUpload.queueId, progressPercent);
          }
        });

        if (activeBatchIdRef.current !== batchId) return;
        if (dismissedUploadIdsRef.current.has(queuedUpload.queueId)) continue;

        if (!assetId) {
          setItemStatus(queuedUpload.queueId, { kind: "uploadFailed" });
          continue;
        }

        if (queuedUpload.shotId) {
          const shotName =
            shots.find((shot) => shot.id === queuedUpload.shotId)?.name ?? "";
          setShotUploadedFirstFrameAssetId(queuedUpload.shotId, assetId);
          setItemStatus(queuedUpload.queueId, { kind: "linked", shotName });
        } else {
          setItemStatus(queuedUpload.queueId, { kind: "unlinkedToAnyShot" });
        }
      } catch {
        if (activeBatchIdRef.current !== batchId) return;
        if (dismissedUploadIdsRef.current.has(queuedUpload.queueId)) continue;
        setItemStatus(queuedUpload.queueId, { kind: "uploadFailed" });
      }
    }

    currentUploadAbortControllerRef.current = undefined;
    activeBatchIdRef.current = undefined;
    setCurrentUploadId(undefined);
    setCurrentUploadStartedAt(undefined);
    setHasCompletedAnyUploadBatch(true);
  };

  const startUpload = (files: File[]) => {
    const { acceptedFiles } = filterFilesByAcceptedType(
      files,
      DEFAULT_ACCEPTED_IMAGE_FILE_TYPES
    );
    if (acceptedFiles.length === 0) return;

    if (activeBatchIdRef.current !== undefined) {
      stopActiveBatch();
    }

    const batchId = crypto.randomUUID();
    activeBatchIdRef.current = batchId;
    dismissedUploadIdsRef.current = new Set();

    const queuedUploads: QueuedUpload[] = acceptedFiles.map((file) => ({
      queueId: crypto.randomUUID(),
      file,
      shotId: undefined
    }));
    const { candidateKeyByShotId } = assignBulkRenderingUploadedFirstFrames({
      shots,
      uploadCandidates: queuedUploads.map((queuedUpload) => ({
        candidateKey: queuedUpload.queueId,
        fileName: queuedUpload.file.name
      }))
    });
    const shotIdByQueueId = new Map(
      Object.entries(candidateKeyByShotId).map(([shotId, queueId]) => [
        queueId,
        shotId
      ])
    );
    const queue = queuedUploads.map((queuedUpload) => ({
      ...queuedUpload,
      shotId: shotIdByQueueId.get(queuedUpload.queueId)
    }));

    setFileNameById((current) => ({
      ...current,
      ...Object.fromEntries(
        queue.map((queuedUpload) => [
          queuedUpload.queueId,
          queuedUpload.file.name
        ])
      )
    }));
    setStatusById((current) => ({
      ...current,
      ...Object.fromEntries(
        queue.map((queuedUpload) => [
          queuedUpload.queueId,
          { kind: "notStarted" as const }
        ])
      )
    }));
    setItemOrder((current) => [
      ...current,
      ...queue.map((queuedUpload) => queuedUpload.queueId)
    ]);

    void processQueue(queue, batchId);
  };

  const dismissItem = (itemId: string) => {
    dismissedUploadIdsRef.current.add(itemId);
    if (itemId === currentUploadId) {
      currentUploadAbortControllerRef.current?.abort();
    }
    setItemOrder((current) => current.filter((id) => id !== itemId));
  };

  const cancelAll = () => {
    stopActiveBatch();
    setHasCompletedAnyUploadBatch(true);
  };

  const closeAll = () => {
    setItemOrder([]);
    setFileNameById({});
    setStatusById({});
  };

  const items: BulkRenderingFirstFrameUploadItem[] = itemOrder.map((id) => {
    const baseStatus = statusById[id] ?? { kind: "notStarted" as const };
    const status: BulkRenderingFirstFrameUploadRowStatus =
      baseStatus.kind === "uploading" && id === currentUploadId
        ? {
            ...baseStatus,
            elapsedTimeLabel:
              formatBulkRendersRunElapsedTime({
                startedAt: currentUploadStartedAt,
                now: new Date()
              }) ?? "00:00:00"
          }
        : baseStatus;

    return {
      id,
      fileName: fileNameById[id] ?? "",
      status
    };
  });

  return {
    items,
    hasCompletedAnyUploadBatch,
    startUpload,
    dismissItem,
    cancelAll,
    closeAll
  };
};
