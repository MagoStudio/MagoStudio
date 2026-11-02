import { VideoAssetCreationData } from "@hooks/assets/interface";
import { LayerType } from "@schemas/layer";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { VideoAssetResponse } from "../asset/interface";

import {
  INGESTION_TIMEOUT_MS,
  UPLOAD_PROGRESS_COMPLETE,
  UPLOAD_PROGRESS_PART_IN_TOTAL_LOADING
} from "./constants";
import { ingestVideo } from "./ingestVideo";
import { IngestProgressEvent, IngestVideoDeps } from "./types";

const ASSET_ID = "asset-1";
const TRACK_ID = "track-1";
const SHOT_ID = "shot-1";
const PROJECT_ID = "project-1";

const buildCreationResponse = (): VideoAssetCreationData =>
  ({
    video_url: "https://s3.test/video",
    meta_url: "https://s3.test/meta",
    timeline: {
      id: SHOT_ID,
      name: "Shot",
      project_id: PROJECT_ID,
      settings: {},
      user_id: "user-1",
      layers: [
        {
          id: TRACK_ID,
          name: "my-video",
          type: LayerType.IMAGE,
          created_at: "2026-01-01T00:00:00Z",
          clips: [{ asset: { id: ASSET_ID } }]
        }
      ]
    }
  }) as unknown as VideoAssetCreationData;

const INGESTED_RESPONSE = {
  asset: { data: { status: "ingested" } }
} as unknown as VideoAssetResponse;

const PROCESSING_RESPONSE = {
  asset: { data: { status: "processing" } }
} as unknown as VideoAssetResponse;

const buildDeps = (
  overrides: Partial<IngestVideoDeps> = {}
): IngestVideoDeps => ({
  createVideoAsset: vi.fn().mockResolvedValue(buildCreationResponse()),
  uploadAssetToS3: vi.fn().mockResolvedValue(undefined),
  publishIngestionJob: vi.fn().mockResolvedValue({ job_id: "job-1" }),
  fetchVideoAssetStatus: vi.fn().mockResolvedValue(INGESTED_RESPONSE),
  invalidateAfterIngest: vi.fn().mockResolvedValue(undefined),
  cacheVideoFile: vi.fn().mockResolvedValue(undefined),
  waitForPollTick: vi.fn().mockResolvedValue(undefined),
  ...overrides
});

const buildParams = () => ({
  shotId: SHOT_ID,
  projectId: PROJECT_ID,
  file: new File(["video-bytes"], "my-video.mp4", { type: "video/mp4" })
});

describe("ingestVideo", () => {
  let progressEvents: IngestProgressEvent[];
  let onProgress: (event: IngestProgressEvent) => void;

  beforeEach(() => {
    progressEvents = [];
    onProgress = (event) => progressEvents.push(event);
  });

  describe("happy path", () => {
    it("resolves as ingested with the created asset and track ids", async () => {
      const result = await ingestVideo(buildParams(), buildDeps());

      expect(result).toEqual({
        outcome: "ingested",
        assetId: ASSET_ID,
        trackId: TRACK_ID
      });
    });

    it("runs the sequence in order", async () => {
      const callOrder: string[] = [];
      const deps = buildDeps({
        createVideoAsset: vi.fn(async () => {
          callOrder.push("createVideoAsset");
          return buildCreationResponse();
        }),
        uploadAssetToS3: vi.fn(async () => {
          callOrder.push("uploadAssetToS3");
        }),
        publishIngestionJob: vi.fn(async () => {
          callOrder.push("publishIngestionJob");
          return {};
        }),
        invalidateAfterIngest: vi.fn(async () => {
          callOrder.push("invalidateAfterIngest");
        })
      });

      await ingestVideo(buildParams(), deps);

      expect(callOrder).toEqual([
        "createVideoAsset",
        "uploadAssetToS3",
        "publishIngestionJob",
        "invalidateAfterIngest"
      ]);
    });

    it("reports phases in order and never decreases progress", async () => {
      await ingestVideo({ ...buildParams(), onProgress }, buildDeps());

      const phases = [...new Set(progressEvents.map((event) => event.phase))];
      expect(phases).toEqual([
        "creating",
        "uploading",
        "ingesting",
        "finalizing"
      ]);

      const uploadingOnwards = progressEvents.slice(
        progressEvents.findIndex((event) => event.phase === "uploading")
      );
      uploadingOnwards.forEach((event, index) => {
        if (index === 0) return;
        expect(event.progress).toBeGreaterThanOrEqual(
          uploadingOnwards[index - 1].progress
        );
      });
    });

    it("scales transfer progress into the 0-25 band and finishes at 100", async () => {
      const deps = buildDeps({
        uploadAssetToS3: vi.fn(async ({ onUploadProgress }) => {
          onUploadProgress?.(50);
          onUploadProgress?.(100);
        })
      });

      await ingestVideo({ ...buildParams(), onProgress }, deps);

      const uploadingProgress = progressEvents
        .filter((event) => event.phase === "uploading")
        .map((event) => event.progress);

      expect(uploadingProgress).toContain(
        Math.round(UPLOAD_PROGRESS_PART_IN_TOTAL_LOADING / 2)
      );
      expect(uploadingProgress.at(-1)).toBe(
        UPLOAD_PROGRESS_PART_IN_TOTAL_LOADING
      );
      expect(progressEvents.at(-1)).toEqual({
        phase: "finalizing",
        progress: UPLOAD_PROGRESS_COMPLETE
      });
    });

    it("fires onUploaded after the transfer and before publishing the ingestion job", async () => {
      const callOrder: string[] = [];
      const deps = buildDeps({
        uploadAssetToS3: vi.fn(async () => {
          callOrder.push("uploadAssetToS3");
        }),
        publishIngestionJob: vi.fn(async () => {
          callOrder.push("publishIngestionJob");
          return {};
        })
      });

      await ingestVideo(
        {
          ...buildParams(),
          onUploaded: () => callOrder.push("onUploaded")
        },
        deps
      );

      expect(callOrder).toEqual([
        "uploadAssetToS3",
        "onUploaded",
        "publishIngestionJob"
      ]);
    });

    it("uploads trim metadata before the video when supplied", async () => {
      const uploadAssetToS3 = vi.fn().mockResolvedValue(undefined);
      const deps = buildDeps({ uploadAssetToS3 });

      await ingestVideo(
        { ...buildParams(), trimMetadata: { trimStart: 1, trimEnd: 2 } },
        deps
      );

      expect(uploadAssetToS3).toHaveBeenCalledTimes(2);
      expect(uploadAssetToS3.mock.calls[0][0].s3_url).toBe(
        "https://s3.test/meta"
      );
      expect(uploadAssetToS3.mock.calls[1][0].s3_url).toBe(
        "https://s3.test/video"
      );
    });

    it("skips the metadata upload when no trim metadata is supplied", async () => {
      const uploadAssetToS3 = vi.fn().mockResolvedValue(undefined);

      await ingestVideo(buildParams(), buildDeps({ uploadAssetToS3 }));

      expect(uploadAssetToS3).toHaveBeenCalledOnce();
    });

    it("polls only once per refetch interval", async () => {
      const fetchVideoAssetStatus = vi
        .fn()
        .mockResolvedValueOnce(PROCESSING_RESPONSE)
        .mockResolvedValue(INGESTED_RESPONSE);

      await ingestVideo(buildParams(), buildDeps({ fetchVideoAssetStatus }));

      expect(fetchVideoAssetStatus).toHaveBeenCalledTimes(2);
    });

    it("does not fail the ingest when caching the video locally fails", async () => {
      const deps = buildDeps({
        cacheVideoFile: vi.fn().mockRejectedValue(new Error("quota exceeded"))
      });

      await expect(ingestVideo(buildParams(), deps)).resolves.toMatchObject({
        outcome: "ingested"
      });
    });
  });

  describe("failures", () => {
    it("throws the backend error message when polling reports one", async () => {
      const deps = buildDeps({
        fetchVideoAssetStatus: vi.fn().mockResolvedValue({
          error_type: "ingestion_failed",
          error_message: "Unsupported codec"
        })
      });

      await expect(ingestVideo(buildParams(), deps)).rejects.toThrow(
        "Unsupported codec"
      );
    });

    it("stops polling once the backend reports an error", async () => {
      const fetchVideoAssetStatus = vi.fn().mockResolvedValue({
        error_type: "ingestion_failed",
        error_message: "Unsupported codec"
      });

      await ingestVideo(
        buildParams(),
        buildDeps({ fetchVideoAssetStatus })
      ).catch(() => {});

      expect(fetchVideoAssetStatus).toHaveBeenCalledOnce();
    });

    it("throws when the status request cannot be made", async () => {
      const deps = buildDeps({
        fetchVideoAssetStatus: vi.fn().mockResolvedValue(undefined)
      });

      await expect(ingestVideo(buildParams(), deps)).rejects.toThrow(
        "Failed to fetch video asset status"
      );
    });

    it("surfaces a TimeoutError once the ingestion ceiling is reached", async () => {
      let elapsedMs = 0;
      const deps = buildDeps({
        fetchVideoAssetStatus: vi.fn().mockResolvedValue(PROCESSING_RESPONSE),
        waitForPollTick: vi.fn(async (ms: number) => {
          elapsedMs += ms;
          if (elapsedMs > INGESTION_TIMEOUT_MS) {
            throw new Error("poll loop ran past the ingestion timeout");
          }
          await vi.advanceTimersByTimeAsync(ms);
        })
      });

      vi.useFakeTimers();
      try {
        await expect(ingestVideo(buildParams(), deps)).rejects.toMatchObject({
          name: "TimeoutError"
        });
      } finally {
        vi.useRealTimers();
      }
    });

    it("throws when the created timeline has no image track", async () => {
      const creationWithoutImageTrack = buildCreationResponse();
      creationWithoutImageTrack.timeline.layers = [];

      const deps = buildDeps({
        createVideoAsset: vi.fn().mockResolvedValue(creationWithoutImageTrack)
      });

      await expect(ingestVideo(buildParams(), deps)).rejects.toThrow(
        "Video layer not found"
      );
    });
  });

  describe("cancellation", () => {
    it("returns cancelled without doing any work when already aborted", async () => {
      const deps = buildDeps();
      const controller = new AbortController();
      controller.abort();

      const result = await ingestVideo(
        { ...buildParams(), signal: controller.signal },
        deps
      );

      expect(result).toEqual({ outcome: "cancelled" });
      expect(deps.createVideoAsset).not.toHaveBeenCalled();
    });

    it("returns cancelled without publishing when aborted during the transfer", async () => {
      const controller = new AbortController();
      const deps = buildDeps({
        uploadAssetToS3: vi.fn(async () => {
          controller.abort();
        })
      });

      const result = await ingestVideo(
        { ...buildParams(), signal: controller.signal },
        deps
      );

      expect(result).toEqual({ outcome: "cancelled" });
      expect(deps.publishIngestionJob).not.toHaveBeenCalled();
    });

    it("returns cancelled and stops requesting status when aborted while polling", async () => {
      const controller = new AbortController();
      const fetchVideoAssetStatus = vi
        .fn()
        .mockResolvedValue(PROCESSING_RESPONSE);

      const deps = buildDeps({
        fetchVideoAssetStatus,
        waitForPollTick: vi.fn(async () => {
          controller.abort();
        })
      });

      const result = await ingestVideo(
        { ...buildParams(), signal: controller.signal },
        deps
      );

      expect(result).toEqual({ outcome: "cancelled" });
      expect(fetchVideoAssetStatus).not.toHaveBeenCalled();
      expect(deps.invalidateAfterIngest).not.toHaveBeenCalled();
    });
  });

  describe("invalidation", () => {
    it("awaits invalidation by default", async () => {
      let invalidationSettled = false;
      const deps = buildDeps({
        invalidateAfterIngest: vi.fn(
          () =>
            new Promise<void>((resolve) =>
              setTimeout(() => {
                invalidationSettled = true;
                resolve();
              }, 0)
            )
        )
      });

      await ingestVideo(buildParams(), deps);

      expect(invalidationSettled).toBe(true);
    });

    it("resolves without waiting when awaitInvalidation is false", async () => {
      let invalidationSettled = false;
      const deps = buildDeps({
        invalidateAfterIngest: vi.fn(
          () =>
            new Promise<void>((resolve) =>
              setTimeout(() => {
                invalidationSettled = true;
                resolve();
              }, 0)
            )
        )
      });

      await ingestVideo({ ...buildParams(), awaitInvalidation: false }, deps);

      expect(invalidationSettled).toBe(false);
      expect(deps.invalidateAfterIngest).toHaveBeenCalledWith(PROJECT_ID);
    });

    it("does not reject when a non-awaited invalidation fails", async () => {
      const deps = buildDeps({
        invalidateAfterIngest: vi.fn().mockRejectedValue(new Error("offline"))
      });

      await expect(
        ingestVideo({ ...buildParams(), awaitInvalidation: false }, deps)
      ).resolves.toMatchObject({ outcome: "ingested" });
    });
  });
});
