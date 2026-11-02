import { LayerType } from "@schemas/layer";
import { getLatestVideoLayer } from "@utils";

import { getTrackAsset } from "../track/utils/getTrackAsset";

import {
  INGESTION_TIMEOUT_MS,
  POLL_TICK_INTERVAL_MS,
  REFETCH_VIDEO_ASSET_DATA_INTERVAL,
  UPLOAD_PROGRESS_COMPLETE,
  UPLOAD_PROGRESS_PART_IN_TOTAL_LOADING
} from "./constants";
import { IngestVideoDeps, IngestVideoParams, IngestVideoResult } from "./types";
import { buildTrimMetadataFile } from "./utils/buildTrimMetadataFile";
import {
  composeAbortSignals,
  isTimeoutAbort
} from "./utils/composeAbortSignals";
import { getAssetIngestionError } from "./utils/getAssetIngestionError";
import { getEasedIngestionProgress } from "./utils/getEasedIngestionProgress";
import { getTransferProgress } from "./utils/getTransferProgress";
import { isAssetIngested } from "./utils/isAssetIngested";

const CANCELLED: IngestVideoResult = { outcome: "cancelled" };

export const ingestVideo = async (
  params: IngestVideoParams,
  deps: IngestVideoDeps
): Promise<IngestVideoResult> => {
  const {
    shotId,
    projectId,
    file,
    trimMetadata,
    signal,
    awaitInvalidation = true,
    onProgress,
    onUploaded
  } = params;

  if (signal?.aborted) return CANCELLED;

  const { signal: ingestSignal, release } = composeAbortSignals(
    signal,
    INGESTION_TIMEOUT_MS
  );

  try {
    onProgress?.({ phase: "creating", progress: 0 });

    const creation = await deps.createVideoAsset({ file, shotId });

    if (trimMetadata) {
      await deps.uploadAssetToS3({
        s3_url: creation.meta_url,
        file: buildTrimMetadataFile(trimMetadata)
      });
    }

    const hasImageTrack = creation.timeline.layers.some(
      (layer) => layer.type === LayerType.IMAGE
    );
    const videoTrack = getLatestVideoLayer(creation.timeline.layers);
    if (!hasImageTrack || !videoTrack) {
      throw new Error("Video layer not found");
    }

    const createdAsset = getTrackAsset(videoTrack);
    if (!createdAsset) {
      throw new Error("Video asset not found");
    }
    const assetId = createdAsset.id;

    onProgress?.({ phase: "uploading", progress: 0 });

    await deps.uploadAssetToS3({
      s3_url: creation.video_url,
      file,
      onUploadProgress: (transferPercent) => {
        onProgress?.({
          phase: "uploading",
          progress: getTransferProgress(transferPercent)
        });
      }
    });

    onProgress?.({
      phase: "uploading",
      progress: UPLOAD_PROGRESS_PART_IN_TOTAL_LOADING
    });

    void deps
      .cacheVideoFile(assetId, file)
      .catch((error) => console.warn("Failed to cache video:", error));

    onUploaded?.({ trackId: videoTrack.id, trackName: videoTrack.name });

    if (ingestSignal.aborted) return CANCELLED;

    onProgress?.({
      phase: "ingesting",
      progress: UPLOAD_PROGRESS_PART_IN_TOTAL_LOADING
    });

    await deps.publishIngestionJob(assetId);

    const hasIngested = await pollUntilIngested({
      assetId,
      ingestSignal,
      deps,
      onProgress
    });

    if (!hasIngested) {
      if (isTimeoutAbort(ingestSignal)) {
        throw new DOMException("Video ingestion timed out", "TimeoutError");
      }
      return CANCELLED;
    }

    onProgress?.({ phase: "finalizing", progress: UPLOAD_PROGRESS_COMPLETE });

    const invalidation = deps.invalidateAfterIngest(projectId);
    if (awaitInvalidation) {
      await invalidation;
    } else {
      void invalidation.catch(() => {});
    }

    return { outcome: "ingested", assetId, trackId: videoTrack.id };
  } finally {
    release();
  }
};

const pollUntilIngested = async ({
  assetId,
  ingestSignal,
  deps,
  onProgress
}: {
  assetId: string;
  ingestSignal: AbortSignal;
  deps: IngestVideoDeps;
  onProgress: IngestVideoParams["onProgress"];
}): Promise<boolean> => {
  let elapsedMs = 0;
  let msSinceLastRefetch = 0;

  while (!ingestSignal.aborted) {
    onProgress?.({
      phase: "ingesting",
      progress: Math.round(getEasedIngestionProgress(elapsedMs))
    });

    await deps.waitForPollTick(POLL_TICK_INTERVAL_MS, ingestSignal);
    if (ingestSignal.aborted) return false;

    elapsedMs += POLL_TICK_INTERVAL_MS;
    msSinceLastRefetch += POLL_TICK_INTERVAL_MS;

    if (msSinceLastRefetch < REFETCH_VIDEO_ASSET_DATA_INTERVAL) continue;
    msSinceLastRefetch = 0;

    const assetResponse = await deps.fetchVideoAssetStatus(assetId);
    if (assetResponse === undefined) {
      throw new Error("Failed to fetch video asset status");
    }

    const ingestionError = getAssetIngestionError(assetResponse);
    if (ingestionError) {
      throw new Error(ingestionError);
    }

    if (isAssetIngested(assetResponse)) return true;
  }

  return false;
};
