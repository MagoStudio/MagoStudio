import { mediaDownloads } from "@domains/asset/mediaDownloads";
import { markLinkedCloudMirrorProjects } from "@domains/cloud/markLinkedCloudMirrorProjects";
import { removeImportedCloudMirrorProjects } from "@domains/cloud/removeImportedCloudMirrorProjects";
import { ProjectSchema } from "@schemas/project";
import {
  ProjectCutSchema,
  ProjectStateSchema,
  ScriptVersionListSchema
} from "@schemas/scriptProject";

import { backendApiClient } from "@/lib/backend-api-client";
import { getLocalDesktopApi } from "@/platform/localDesktop";

import { collectCloudReferenceAssetIds } from "../../../desktop/shared/collectCloudReferenceAssetIds";

import { mergeMirroredPlanDetails } from "./utils/mergeMirroredPlanDetails";
import { selectCloudVideoPreviewThumbnailUrl } from "./utils/selectCloudVideoPreviewThumbnailUrl";

let syncInFlight: Promise<void> | null = null;
let syncAbortController: AbortController | null = null;
let deferredSyncTimer: ReturnType<typeof setTimeout> | null = null;
type ProjectSyncOperation = {
  promise: Promise<void>;
  controller: AbortController;
};
const projectSyncsInFlight = new Map<string, ProjectSyncOperation>();
const syncStatusListeners = new Set<() => void>();
const projectMetadataListeners = new Set<(projectId: string) => void>();
let lastSyncStatus = false;
let catalogProgress: { completed: number; total: number } | null = null;
const catalogProgressListeners = new Set<() => void>();
export const getCloudProjectCatalogSyncProgress = () => catalogProgress;
export const subscribeCloudProjectCatalogSyncProgress = (
  listener: () => void
): (() => void) => {
  catalogProgressListeners.add(listener);
  return () => catalogProgressListeners.delete(listener);
};
const publishCatalogProgress = (progress: typeof catalogProgress): void => {
  catalogProgress = progress;
  catalogProgressListeners.forEach((listener) => listener());
};
const BACKGROUND_WRITE_INTERVAL_MS = 75;
const NAVIGATION_GRACE_PERIOD_MS = 1500;

/**
 * Catalog mirroring is deliberately lower priority than navigation. Awaiting
 * an already-resolved IPC promise only yields to the microtask queue, which can
 * still starve clicks while a large catalog is written row by row. A timer
 * boundary lets React navigation and the selected-project IPC read run first.
 */
const yieldToInteractiveWork = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, BACKGROUND_WRITE_INTERVAL_MS));

const readSyncStatus = (): boolean =>
  syncInFlight !== null || projectSyncsInFlight.size > 0;

const publishSyncStatus = (): void => {
  const nextStatus = readSyncStatus();
  if (nextStatus === lastSyncStatus) return;
  lastSyncStatus = nextStatus;
  syncStatusListeners.forEach((listener) => listener());
};

export const getCloudProjectSyncStatus = (): boolean => lastSyncStatus;

export const subscribeCloudProjectSyncStatus = (
  listener: () => void
): (() => void) => {
  syncStatusListeners.add(listener);
  return () => syncStatusListeners.delete(listener);
};

export const subscribeCloudProjectMetadata = (
  listener: (projectId: string) => void
): (() => void) => {
  projectMetadataListeners.add(listener);
  return () => projectMetadataListeners.delete(listener);
};

const publishProjectMetadata = (projectId: string): void => {
  projectMetadataListeners.forEach((listener) => listener(projectId));
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const httpsUrl = (value: unknown): string | undefined =>
  typeof value === "string" && value.startsWith("https://") ? value : undefined;

type MediaJob = { assetId: string; timelineId: string; isImage: boolean };
const assetReadyListeners = new Set<
  (projectId: string, assetId: string) => void
>();

export const subscribeCloudAssetReady = (
  listener: (projectId: string, assetId: string) => void
): (() => void) => {
  assetReadyListeners.add(listener);
  return () => assetReadyListeners.delete(listener);
};

/** Move an asset to the front of the download queue, e.g. its track is on screen. */
export const promoteCloudAsset = (assetId: string): (() => void) =>
  mediaDownloads.demand(assetId);

/** Move every asset of a Shot ahead of the rest of the project. */
export const promoteCloudTimeline = (timelineId: string): void => {
  mediaDownloads.setTimeline(timelineId);
};

/** Assets whose file is not on this machine yet, in document order. */
const collectPendingMediaJobs = (
  localProject: Record<string, unknown> | null
): MediaJob[] => {
  const jobs = new Map<string, MediaJob>();
  const timelines = Array.isArray(localProject?.timelines)
    ? localProject.timelines
    : [];
  for (const timeline of timelines) {
    if (!isRecord(timeline) || !Array.isArray(timeline.layers)) continue;
    for (const layer of timeline.layers) {
      if (!isRecord(layer) || !Array.isArray(layer.clips)) continue;
      for (const clip of layer.clips) {
        if (!isRecord(clip) || !isRecord(clip.asset)) continue;
        const asset = clip.asset;
        if (typeof asset.id !== "string" || jobs.has(asset.id)) continue;
        if (isRecord(asset.data) && asset.data.status === "ingested") continue;
        jobs.set(asset.id, {
          assetId: asset.id,
          timelineId: typeof timeline.id === "string" ? timeline.id : "",
          isImage: asset.type === "IMAGE"
        });
      }
    }
  }
  return [...jobs.values()];
};

const resolveAssetUrls = async (
  assetId: string,
  isImage: boolean,
  signal: AbortSignal
): Promise<{ sourceUrl?: string; thumbnailUrl?: string }> => {
  const response = await backendApiClient.get(`/assets/${assetId}`, { signal });
  const detail = isRecord(response.data) ? response.data : {};
  const asset = isRecord(detail.asset) ? detail.asset : {};
  const data = isRecord(asset.data) ? asset.data : {};
  const thumbnails = Array.isArray(data.thumbnails)
    ? data.thumbnails.filter(isRecord)
    : [];
  const thumbnailUrl =
    httpsUrl(detail.thumbnail_url) ??
    selectCloudVideoPreviewThumbnailUrl(thumbnails) ??
    (isImage ? httpsUrl(detail.s3_url) : undefined);
  const sourceUrl = httpsUrl(detail.original_url) ?? httpsUrl(detail.s3_url);
  return { sourceUrl, thumbnailUrl };
};

const hydrateMediaJob = async (
  projectId: string,
  job: MediaJob,
  signal: AbortSignal
): Promise<void> => {
  const urls = await resolveAssetUrls(job.assetId, job.isImage, signal);
  signal.throwIfAborted();
  const desktop = getLocalDesktopApi();
  const cancel = () => {
    void desktop.projects
      .cancelCloudAsset?.(projectId, job.assetId)
      .catch(() => {});
  };
  signal.addEventListener("abort", cancel, { once: true });
  try {
    const cached = await desktop.projects.cacheCloudAsset({
      projectId,
      assetId: job.assetId,
      isImage: job.isImage,
      ...urls
    });
    if (cached) {
      assetReadyListeners.forEach((listener) =>
        listener(projectId, job.assetId)
      );
    } else throw new Error(`Cloud asset ${job.assetId} is not available yet`);
  } finally {
    signal.removeEventListener("abort", cancel);
  }
};

/** Downloads a project's missing media a few assets at a time, always taking
 * the most urgent asset next, and announces each one as it lands. */
const hydrateProjectMedia = async (
  projectId: string,
  jobs: MediaJob[],
  signal: AbortSignal
): Promise<void> => {
  jobs.forEach((job) =>
    mediaDownloads.registerAsset(job.assetId, {
      projectId,
      timelineId: job.timelineId
    })
  );
  await Promise.all(
    jobs.map((job) =>
      mediaDownloads
        .enqueue({
          key: `mirror:${job.assetId}`,
          assetId: job.assetId,
          projectId,
          timelineId: job.timelineId,
          kind: job.isImage ? "image" : "video",
          signal,
          run: (downloadSignal) =>
            hydrateMediaJob(projectId, job, downloadSignal)
        })
        .catch((error) => {
          if (!signal.aborted)
            console.warn(`Failed to cache cloud asset ${job.assetId}`, error);
        })
    )
  );
};

export const hydrateScriptMedia = async (
  projectId: string,
  documents: unknown[],
  signal: AbortSignal
): Promise<void> => {
  const jobs = new Map<
    string,
    { url: string; assetId: string; isImage: boolean }
  >();
  const visit = (
    value: unknown,
    inheritedAssetId?: string,
    imageHint = false
  ) => {
    if (Array.isArray(value)) {
      value.forEach((member) => visit(member, inheritedAssetId, imageHint));
      return;
    }
    if (!isRecord(value)) return;
    const assetId =
      typeof value.asset_id === "string" ? value.asset_id : inheritedAssetId;
    for (const [key, member] of Object.entries(value)) {
      if (
        ["url", "thumbnail_url", "poster_url"].includes(key) &&
        httpsUrl(member)
      ) {
        const url = member as string;
        jobs.set(url, {
          url,
          assetId: assetId ?? url,
          isImage:
            imageHint ||
            key !== "url" ||
            /\.(?:jpe?g|png|webp)(?:\?|$)/i.test(url)
        });
      } else visit(member, assetId, imageHint || key === "images");
    }
  };
  documents.forEach((document) => visit(document));
  const desktop = getLocalDesktopApi();
  await Promise.all(
    [...jobs.values()].map((job) => {
      mediaDownloads.registerAsset(job.assetId, { projectId });
      return mediaDownloads
        .enqueue({
          key: `script-mirror:${projectId}:${job.url}`,
          assetId: job.assetId,
          projectId,
          kind: job.isImage ? "image" : "video",
          signal,
          run: async (downloadSignal) => {
            downloadSignal.throwIfAborted();
            const cancel = () => {
              void desktop.scriptProjects
                .cancelMedia(projectId, job.url)
                .catch(() => {});
            };
            downloadSignal.addEventListener("abort", cancel, { once: true });
            try {
              await desktop.scriptProjects.cacheMedia(projectId, job.url);
              assetReadyListeners.forEach((listener) =>
                listener(projectId, job.assetId)
              );
            } finally {
              downloadSignal.removeEventListener("abort", cancel);
            }
          }
        })
        .catch((error) => {
          if (!signal.aborted)
            console.warn(`Failed to cache script media ${job.assetId}`, error);
        });
    })
  );
};

const mirrorProjectContent = async (
  projectId: string,
  project: Record<string, unknown>,
  signal: AbortSignal
): Promise<void> => {
  const [stateResponse, versionsResponse, cutResponse] = await Promise.all([
    backendApiClient.get(`/projects/${projectId}/state`, { signal }),
    backendApiClient.get(`/projects/${projectId}/script`, { signal }),
    backendApiClient.get(`/projects/${projectId}/cut`, { signal })
  ]);
  const state = ProjectStateSchema.parse(stateResponse.data);
  const scriptVersions = ScriptVersionListSchema.parse(versionsResponse.data);
  const cut = ProjectCutSchema.parse(cutResponse.data);
  const planIds = [
    ...new Set(
      scriptVersions.versions.flatMap((version) =>
        version.plan_id ? [version.plan_id] : []
      )
    )
  ];
  const desktop = getLocalDesktopApi();
  {
    // Open-tab content must not wait for historical casting plans.
    await desktop.scriptProjects.put({
      projectId,
      metadataOnly: true,
      project,
      state,
      scriptVersions,
      cut
    });
    publishProjectMetadata(projectId);
  }
  const mediaReady = hydrateScriptMedia(
    projectId,
    [state, scriptVersions, cut],
    signal
  );
  const planEntries = await Promise.all(
    planIds.map(async (planId) => {
      try {
        return [
          planId,
          (await backendApiClient.get(`/agent/plans/${planId}`, { signal }))
            .data as Record<string, unknown>
        ] as const;
      } catch (error) {
        if (signal.aborted) throw error;
        console.warn(`Failed to mirror script casting plan ${planId}`, error);
        return null;
      }
    })
  );
  const fetchedPlanDetails = Object.fromEntries(
    planEntries.filter(
      (entry): entry is readonly [string, Record<string, unknown>] => !!entry
    )
  );
  const someListedPlanFailedToFetch =
    Object.keys(fetchedPlanDetails).length < planIds.length;
  const cachedPlanDetails = someListedPlanFailedToFetch
    ? ((await desktop.scriptProjects.get(projectId))?.planDetails ?? null)
    : null;
  const planDetails = mergeMirroredPlanDetails({
    listedPlanIds: planIds,
    fetchedPlanDetails,
    cachedPlanDetails
  });
  await desktop.scriptProjects.put({
    projectId,
    metadataOnly: true,
    project,
    state,
    scriptVersions,
    planDetails,
    cut
  });
  publishProjectMetadata(projectId);
  await Promise.all([
    mediaReady,
    hydrateScriptMedia(projectId, [planDetails], signal)
  ]);
};

const performProjectSync = async (
  projectId: string,
  signal: AbortSignal,
  options: { timelineId?: string; hydrateMedia: boolean }
): Promise<void> => {
  const desktop = getLocalDesktopApi();
  if (desktop.account.mode !== "cloud") return;

  const response = await backendApiClient.get(`/projects/${projectId}`, {
    signal
  });
  const parsed = ProjectSchema.safeParse(response.data);
  if (!parsed.success) return;
  const project = response.data as Record<string, unknown>;

  if (parsed.data.type !== "script_to_shots") {
    // Commit the complete timeline graph before touching media. The project
    // is navigable immediately and every missing asset starts out pending.
    const accepted = await desktop.projects.mirrorCloud({
      project,
      includeContent: true
    });
    if (!accepted) return;
    publishProjectMetadata(projectId);
    if (signal.aborted || !options.hydrateMedia) return;

    const jobs = collectPendingMediaJobs(await desktop.projects.get(projectId));
    const queuedAssetIds = new Set(jobs.map(({ assetId }) => assetId));
    const timelines = Array.isArray(project.timelines) ? project.timelines : [];
    for (const assetId of collectCloudReferenceAssetIds(
      timelines.filter(isRecord)
    )) {
      if (queuedAssetIds.has(assetId)) continue;
      const localAsset = await desktop.assets.get(assetId);
      if (localAsset?.data.status === "ingested") continue;
      jobs.push({ assetId, timelineId: "", isImage: true });
    }
    await hydrateProjectMedia(projectId, jobs, signal);
    return;
  }

  // Metadata is committed first. Even if an early project has no cut yet, it
  // appears in the local project list and its richer snapshot can retry later.
  await desktop.scriptProjects.put({ projectId, project });
  publishProjectMetadata(projectId);
  if (signal.aborted) return;
  await mirrorProjectContent(projectId, project, signal);
  publishProjectMetadata(projectId);
};

export const syncCloudScriptProject = (
  projectId: string,
  timelineId?: string
): Promise<void> => {
  if (timelineId) mediaDownloads.setForeground(projectId, timelineId);
  const existing = projectSyncsInFlight.get(projectId);
  if (existing && !existing.controller.signal.aborted) {
    // Switching Shot only changes what is urgent; it never restarts the sync.
    if (timelineId) promoteCloudTimeline(timelineId);
    return existing.promise;
  }
  existing?.controller.abort();
  const controller = new AbortController();
  const promise = performProjectSync(projectId, controller.signal, {
    timelineId,
    hydrateMedia: true
  }).finally(() => {
    if (projectSyncsInFlight.get(projectId)?.promise === promise) {
      projectSyncsInFlight.delete(projectId);
      publishSyncStatus();
    }
  });
  const operation = { promise, controller };
  projectSyncsInFlight.set(projectId, operation);
  publishSyncStatus();
  return promise;
};

export const cancelCloudProjectSync = (projectId: string): void => {
  const operation = projectSyncsInFlight.get(projectId);
  if (!operation) return;
  operation.controller.abort();
  const desktop = getLocalDesktopApi();
  if (desktop.projects.cancelCloudMirror) {
    void desktop.projects.cancelCloudMirror(projectId).catch((error) => {
      console.warn(`Failed to cancel cloud project sync ${projectId}`, error);
    });
  }
};

export const syncCloudProject = syncCloudScriptProject;

/** Commits a project's structure to the local library and stops there. Used
 * right after the app itself changed the cloud project (create, rename,
 * upload), where the caller needs the new shots and tracks locally but must not
 * wait for every video to download. The media follows from the project's
 * normal sync. */
export const syncCloudProjectMetadata = (projectId: string): Promise<void> =>
  performProjectSync(projectId, new AbortController().signal, {
    hydrateMedia: false
  });

const tidyCloudMirrorProjects = async ({
  catalogCloudProjectIds,
  signal
}: {
  catalogCloudProjectIds: ReadonlySet<string>;
  signal: AbortSignal;
}): Promise<void> => {
  try {
    const libraryProjects = await getLocalDesktopApi().projects.list();
    await markLinkedCloudMirrorProjects({ libraryProjects, signal });
    if (signal.aborted) return;
    await removeImportedCloudMirrorProjects({
      libraryProjects,
      catalogCloudProjectIds,
      signal
    });
  } catch (error) {
    if (signal.aborted) return;
    console.warn("Failed to tidy Cloud Mirror Projects", error);
  }
};

const performSync = async (signal: AbortSignal): Promise<void> => {
  const desktop = getLocalDesktopApi();
  if (desktop.account.mode !== "cloud") return;

  try {
    const response = await backendApiClient.get("/projects/homepage/list", {
      signal,
      params: {
        page: 1,
        per_page: -1,
        sort_by: "updated_at",
        sort_order: "desc"
      }
    });
    const items = isRecord(response.data) ? response.data.items : undefined;
    if (!Array.isArray(items)) return;
    const total = items.filter(
      (candidate) => isRecord(candidate) && typeof candidate.id === "string"
    ).length;
    let completed = 0;
    publishCatalogProgress({ completed, total });

    // The homepage needs metadata only. Hydrating every script project here multiplied one
    // catalog request into hundreds of detail requests; the selected project is synchronized
    // separately by useCloudProjectSync when the user opens it.
    // Do not enqueue every catalog write at once. The desktop database
    // serializes writes, so a Promise.all here put an interactive project read
    // behind the entire catalog and made opening a local project appear to
    // wait for synchronization. Keeping at most one mirror write in flight
    // leaves room for navigation reads between catalog entries.
    for (const candidate of items) {
      if (signal.aborted) return;
      if (!isRecord(candidate) || typeof candidate.id !== "string") continue;
      await yieldToInteractiveWork();
      if (signal.aborted) return;
      try {
        await desktop.projects.mirrorCloud({
          project: candidate,
          includeContent: false
        });
        publishProjectMetadata(candidate.id);
      } catch (error) {
        console.warn(`Failed to mirror cloud project ${candidate.id}`, error);
      }
      completed += 1;
      publishCatalogProgress({ completed, total });
    }
    if (signal.aborted) return;
    await tidyCloudMirrorProjects({
      catalogCloudProjectIds: new Set(
        items.flatMap((candidate) =>
          isRecord(candidate) && typeof candidate.id === "string"
            ? [candidate.id]
            : []
        )
      ),
      signal
    });
  } catch (error) {
    if (signal.aborted) return;
    // A failed refresh is the expected offline launch path. The callers read
    // the last local snapshot immediately after this returns.
    console.warn(
      "Using cached script projects because cloud sync failed",
      error
    );
  }
};

export const syncCloudScriptProjects = (): Promise<void> => {
  if (deferredSyncTimer) {
    clearTimeout(deferredSyncTimer);
    deferredSyncTimer = null;
  }
  if (syncInFlight) return syncInFlight;
  const controller = new AbortController();
  syncAbortController = controller;
  const operation = performSync(controller.signal).finally(() => {
    if (syncInFlight === operation) {
      syncInFlight = null;
      syncAbortController = null;
      publishCatalogProgress(null);
      publishSyncStatus();
    }
  });
  syncInFlight = operation;
  publishSyncStatus();
  return syncInFlight;
};

/** Stop low-priority catalog writes as soon as the user opens a project.
 * Returning to the homepage starts a fresh background refresh. */
export const cancelCloudProjectCatalogSync = (): void => {
  syncAbortController?.abort();
};

/** Give project navigation a clean head start, then continue refreshing the
 * catalog in the background instead of waiting for another homepage visit. */
export const deferCloudProjectCatalogSync = (): void => {
  const interruptedSync = syncInFlight;
  cancelCloudProjectCatalogSync();
  if (deferredSyncTimer) clearTimeout(deferredSyncTimer);
  deferredSyncTimer = setTimeout(() => {
    deferredSyncTimer = null;
    void Promise.resolve(interruptedSync)
      .catch(() => undefined)
      .then(() => syncCloudScriptProjects());
  }, NAVIGATION_GRACE_PERIOD_MS);
};
