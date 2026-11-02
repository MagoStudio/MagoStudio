import { getLocalDesktopApi } from "@/platform/localDesktop";

import { CloudApi } from "./mirrorService";
import { findQueueItemForAsset, toJobStatus } from "./queueStatus";
import {
  CANCELLED_CLOUD_RENDER_MESSAGE,
  CloudRenderSettlement,
  settleCloudRenderFromAsset
} from "./settleCloudRenderFromAsset";

/**
 * Advances every cloud render that is still in flight.
 *
 * Status comes from the queue rather than the asset endpoint, so one request per
 * project covers all its jobs and a queued render is distinguishable from a
 * running one. When a render finishes, the output is downloaded into the library
 * by the main process and the local asset becomes an ordinary local asset — from
 * then on it plays offline and the cloud is never consulted again.
 *
 * The project queue omits cancelled, paused and old items, so a job missing from
 * it is looked up in the user's unfiltered queue, and failing that settled from
 * the render asset itself.
 */

export interface PollOutcome {
  checked: number;
  finished: number;
  failed: number;
}

const bridge = () => getLocalDesktopApi();

const recordSettlement = (
  outcome: PollOutcome,
  settlement: CloudRenderSettlement
) => {
  if (settlement === "finished") outcome.finished += 1;
  if (settlement === "failed") outcome.failed += 1;
};

const createUnfilteredQueueLoader = (api: CloudApi) => {
  let unfilteredQueueRequest: Promise<unknown> | null = null;
  return () => {
    unfilteredQueueRequest ??= api
      .get<unknown>("/queue/unfiltered")
      .catch(() => null);
    return unfilteredQueueRequest;
  };
};

export const pollCloudRenders = async (api: CloudApi): Promise<PollOutcome> => {
  const jobs = (await bridge().cloud.renders.listActive()).filter(
    (job) => job.kind !== "img2img"
  );
  const outcome: PollOutcome = { checked: jobs.length, finished: 0, failed: 0 };
  if (jobs.length === 0) return outcome;

  const byProject = new Map<string, typeof jobs>();
  for (const job of jobs) {
    const existing = byProject.get(job.projectId);
    if (existing) existing.push(job);
    else byProject.set(job.projectId, [job]);
  }

  const loadUnfilteredQueue = createUnfilteredQueueLoader(api);

  for (const [localProjectId, projectJobs] of byProject) {
    const link = await bridge().cloud.links.get("project", localProjectId);
    if (!link) continue;

    let queue: unknown;
    try {
      queue = await api.get(`/queue/project/${link.cloudId}`);
    } catch {
      continue;
    }

    for (const job of projectJobs) {
      const cloudAssetId = job.cloudAssetId;
      if (!cloudAssetId) continue;
      const jobWithCloudAsset = { id: job.id, cloudAssetId };

      const projectQueueItem = findQueueItemForAsset(queue, cloudAssetId);
      const unfilteredQueue = projectQueueItem
        ? null
        : await loadUnfilteredQueue();
      const isUnfilteredQueueUnavailable =
        !projectQueueItem && unfilteredQueue === null;
      if (isUnfilteredQueueUnavailable) continue;

      const item =
        projectQueueItem ??
        findQueueItemForAsset(unfilteredQueue, cloudAssetId);

      if (!item) {
        recordSettlement(
          outcome,
          await settleCloudRenderFromAsset(api, jobWithCloudAsset, "cancelled")
        );
        continue;
      }

      const status = toJobStatus(item);

      if (status === "SUCCESS") {
        recordSettlement(
          outcome,
          await settleCloudRenderFromAsset(
            api,
            jobWithCloudAsset,
            "still-rendering"
          )
        );
        continue;
      }

      if (status === "FAILED" || status === "CANCELLED") {
        const fallback =
          status === "CANCELLED"
            ? CANCELLED_CLOUD_RENDER_MESSAGE
            : `The cloud render failed (queue item ${item.id})`;
        await bridge().cloud.renders.fail({
          jobId: job.id,
          message: item.failure ?? fallback
        });
        outcome.failed += 1;
        continue;
      }

      const progressPercent =
        item.progress === null ? null : Math.round(item.progress);
      const hasCloudRenderStatusChanged = status !== job.status;
      const hasCloudRenderProgressChanged =
        progressPercent !== null && progressPercent !== job.progress;
      if (hasCloudRenderStatusChanged || hasCloudRenderProgressChanged) {
        await bridge().cloud.renders.setStatus({
          jobId: job.id,
          status,
          ...(progressPercent === null ? {} : { progress: progressPercent })
        });
      }
    }
  }

  return outcome;
};
