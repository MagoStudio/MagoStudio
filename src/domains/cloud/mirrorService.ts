import { getLocalDesktopApi } from "@/platform/localDesktop";

import { toSourceVideoTrimKey } from "../../../desktop/shared/toSourceVideoTrimKey";

import { describeIngestionErrorPayload } from "./describeIngestionErrorPayload";
import {
  findUploadedAssetId,
  findUploadedLayerId
} from "./findUploadedAssetId";
import { ingestionFailureFromRequestError } from "./ingestionFailureFromRequestError";
import { isCloudAssetLinkReusable } from "./isCloudAssetLinkReusable";
import { isCloudResourceAlreadyGoneError } from "./isCloudResourceAlreadyGoneError";
import { isCloudSourceVideoLinkReusable } from "./isCloudSourceVideoLinkReusable";
import { isIngestedCloudSourceVideoUploadOfTrim } from "./isIngestedCloudSourceVideoUploadOfTrim";
import { toAssetScopedCloudSourceVideoLinkLocalId } from "./toAssetScopedCloudSourceVideoLinkLocalId";
import { toCloudImageExtension } from "./toCloudImageExtension";
import { toCloudImageSize } from "./toCloudImageSize";
import { toCloudMirrorProjectSettings } from "./toCloudMirrorProjectSettings";
import { toCloudSourceVideoLinkLocalId } from "./toCloudSourceVideoLinkLocalId";

/**
 * Mirrors just enough of a local project into cloud Mago for a render to run.
 *
 * The local library stays authoritative. Everything here is derived and
 * disposable: each step is cached in `cloud_links`, and a cloud record that has
 * gone away is simply created again. Nothing in this file may write to a local
 * record.
 *
 * The chain runs in the renderer because that is where the authenticated API
 * client lives. Filesystem work is delegated to the main process, which resolves
 * the asset by id — no native path ever crosses the bridge.
 *
 * The endpoint shapes here were validated against staging.
 */

export interface CloudApi {
  post: <T>(url: string, body?: unknown) => Promise<T>;
  get: <T>(url: string) => Promise<T>;
}

const INGESTION_POLL_INTERVAL_MS = 3000;
const INGESTION_POLL_ATTEMPTS = 100;

export type MirrorProgress = (
  step:
    | "project"
    | "timeline"
    | "asset"
    | "encoding"
    | "uploading"
    | "ingesting"
    | "done"
) => void;

const bridge = () => getLocalDesktopApi();

interface CreatedProject {
  id: string;
  timelines?: { id?: unknown }[];
}

const cloudProjectResolutionsInFlight = new Map<string, Promise<string>>();
const cloudRecordsConfirmedThisRun = new Set<string>();

const isCloudOriginLink = (link: { data: Record<string, unknown> }): boolean =>
  link.data.origin === "cloud";

const toCloudProjectConfirmationKey = (cloudProjectId: string): string =>
  `project:${cloudProjectId}`;

const toCloudTimelineConfirmationKey = (
  cloudTimelineId: string,
  cloudProjectId: string
): string => `timeline:${cloudTimelineId}:${cloudProjectId}`;

const isLinkedCloudProjectStillInCloud = async (
  api: CloudApi,
  cloudProjectId: string
): Promise<boolean> => {
  const confirmationKey = toCloudProjectConfirmationKey(cloudProjectId);
  if (cloudRecordsConfirmedThisRun.has(confirmationKey)) return true;
  try {
    await api.get(`/projects/${cloudProjectId}`);
  } catch (err) {
    if (isCloudResourceAlreadyGoneError(err)) return false;
    throw err;
  }
  cloudRecordsConfirmedThisRun.add(confirmationKey);
  return true;
};

const isLinkedCloudTimelineInCloudProject = async (
  api: CloudApi,
  cloudTimelineId: string,
  cloudProjectId: string
): Promise<boolean> => {
  const confirmationKey = toCloudTimelineConfirmationKey(
    cloudTimelineId,
    cloudProjectId
  );
  if (cloudRecordsConfirmedThisRun.has(confirmationKey)) return true;
  let cloudTimeline: { project_id?: unknown } | undefined;
  try {
    cloudTimeline = await api.get<{ project_id?: unknown }>(
      `/timeline/${cloudTimelineId}`
    );
  } catch (err) {
    if (isCloudResourceAlreadyGoneError(err)) return false;
    throw err;
  }
  if (cloudTimeline?.project_id !== cloudProjectId) return false;
  cloudRecordsConfirmedThisRun.add(confirmationKey);
  return true;
};

export const ensureCloudProject = (
  api: CloudApi,
  input: { localProjectId: string; name: string; description?: string }
): Promise<string> => {
  const resolutionInFlight = cloudProjectResolutionsInFlight.get(
    input.localProjectId
  );
  if (resolutionInFlight) return resolutionInFlight;

  const resolution = linkOrCreateCloudProject(api, input).finally(() => {
    cloudProjectResolutionsInFlight.delete(input.localProjectId);
  });
  cloudProjectResolutionsInFlight.set(input.localProjectId, resolution);
  return resolution;
};

const linkOrCreateCloudProject = async (
  api: CloudApi,
  input: { localProjectId: string; name: string; description?: string }
): Promise<string> => {
  const existing = await bridge().cloud.links.get(
    "project",
    input.localProjectId
  );
  if (
    existing &&
    (isCloudOriginLink(existing) ||
      (await isLinkedCloudProjectStillInCloud(api, existing.cloudId)))
  )
    return existing.cloudId;

  const created = await api.post<CreatedProject>("/projects", {
    name: input.name,
    description: input.description ?? "",
    settings: toCloudMirrorProjectSettings(input.localProjectId)
  });
  if (!created?.id) throw new Error("Cloud Mago did not return a project id");

  // Creating a project also creates an empty timeline. Remembering it lets the
  // first shot adopt it instead of leaving an orphan empty shot that a user
  // would see if they opened this project in the cloud web app.
  const spare = created.timelines?.[0]?.id;
  await bridge().cloud.links.put({
    kind: "project",
    localId: input.localProjectId,
    cloudId: created.id,
    data: {
      isCloudProjectMarkedAsMirror: true,
      ...(typeof spare === "string" && spare ? { spareTimelineId: spare } : {})
    }
  });
  cloudRecordsConfirmedThisRun.add(toCloudProjectConfirmationKey(created.id));
  return created.id;
};

export const ensureCloudTimeline = async (
  api: CloudApi,
  input: {
    localShotId: string;
    localProjectId?: string;
    cloudProjectId: string;
    name: string;
  }
): Promise<string> => {
  const existing = await bridge().cloud.links.get(
    "timeline",
    input.localShotId
  );
  if (
    existing &&
    (isCloudOriginLink(existing) ||
      (await isLinkedCloudTimelineInCloudProject(
        api,
        existing.cloudId,
        input.cloudProjectId
      )))
  )
    return existing.cloudId;

  // Adopt the timeline that came free with the project, once.
  const projectLink = input.localProjectId
    ? await bridge().cloud.links.get("project", input.localProjectId)
    : null;
  const spare = projectLink?.data.spareTimelineId;
  if (typeof spare === "string" && spare) {
    await bridge().cloud.links.put({
      kind: "project",
      localId: projectLink!.localId,
      cloudId: projectLink!.cloudId,
      data: { ...projectLink!.data, spareTimelineId: undefined }
    });
    await bridge().cloud.links.put({
      kind: "timeline",
      localId: input.localShotId,
      cloudId: spare
    });
    cloudRecordsConfirmedThisRun.add(
      toCloudTimelineConfirmationKey(spare, projectLink!.cloudId)
    );
    return spare;
  }

  return createCloudTimeline(api, input);
};

const createCloudTimeline = async (
  api: CloudApi,
  input: {
    localShotId: string;
    cloudProjectId: string;
    name: string;
  }
): Promise<string> => {
  const created = await api.post<{ id: string }>(
    `/timelines/${input.cloudProjectId}`,
    { name: input.name }
  );
  if (!created?.id) throw new Error("Cloud Mago did not return a timeline id");

  await bridge().cloud.links.put({
    kind: "timeline",
    localId: input.localShotId,
    cloudId: created.id
  });
  cloudRecordsConfirmedThisRun.add(
    toCloudTimelineConfirmationKey(created.id, input.cloudProjectId)
  );
  return created.id;
};

interface AssetStatusResponse {
  asset?: {
    data?: {
      status?: string;
      error?: unknown;
    };
  };
}

class CloudTimelineOccupiedError extends Error {
  constructor() {
    super("Cloud timeline already contains an uploaded video");
    this.name = "CloudTimelineOccupiedError";
  }
}

interface CloudSourceVideo {
  cloudAssetId: string;
  cloudLayerId: string | null;
  cloudSourceVideoLinkLocalId: string;
}

interface CloudSourceVideoLink {
  localId: string;
  cloudId: string;
  data: Record<string, unknown>;
}

const toCloudSourceVideo = (link: CloudSourceVideoLink): CloudSourceVideo => ({
  cloudAssetId: link.cloudId,
  cloudLayerId:
    typeof link.data.cloudLayerId === "string" ? link.data.cloudLayerId : null,
  cloudSourceVideoLinkLocalId: link.localId
});

const adoptAssetScopedCloudSourceVideoLink = async (
  api: CloudApi,
  input: {
    localAssetId: string;
    cloudTimelineId: string;
    sourceVideoTrimKey: string;
    sourceVideoLinkLocalId: string;
  }
): Promise<CloudSourceVideo | null> => {
  const assetScopedLink = await bridge().cloud.links.get(
    "asset",
    toAssetScopedCloudSourceVideoLinkLocalId(input)
  );
  const isAssetScopedLinkAnUploadOfRequestedTrim =
    isIngestedCloudSourceVideoUploadOfTrim(
      assetScopedLink,
      input.sourceVideoTrimKey
    );
  if (!assetScopedLink || !isAssetScopedLinkAnUploadOfRequestedTrim)
    return null;

  const shotCloudTimeline = await api.get<unknown>(
    `/timeline/${input.cloudTimelineId}`
  );
  const cloudLayerIdOnShotTimeline = findUploadedLayerId(
    { timeline: shotCloudTimeline },
    assetScopedLink.cloudId
  );
  if (!cloudLayerIdOnShotTimeline) return null;

  const adoptedLink = {
    kind: "asset" as const,
    localId: input.sourceVideoLinkLocalId,
    cloudId: assetScopedLink.cloudId,
    data: {
      ...assetScopedLink.data,
      sourceVideoTrimKey: input.sourceVideoTrimKey,
      cloudTimelineId: input.cloudTimelineId,
      cloudLayerId: cloudLayerIdOnShotTimeline
    }
  };
  await bridge().cloud.links.put(adoptedLink);
  return toCloudSourceVideo(adoptedLink);
};

/** Ingestion status is nested under `asset`, not at the response root. */
const ingestionStatus = (response: AssetStatusResponse): string | undefined =>
  response?.asset?.data?.status;

interface CloudSourceVideoRequest {
  localAssetId: string;
  localShotId: string;
  cloudTimelineId: string;
  name: string;
  trimStartSeconds?: number;
  trimEndSeconds?: number;
  onProgress?: MirrorProgress;
}

const ensureCloudSourceVideo = async (
  api: CloudApi,
  input: CloudSourceVideoRequest
): Promise<CloudSourceVideo> => {
  const assetLink = await bridge().cloud.links.get("asset", input.localAssetId);
  const isSourceVideoOwnedByCloud = assetLink?.data.origin === "cloud";
  if (assetLink && isSourceVideoOwnedByCloud)
    return toCloudSourceVideo(assetLink);

  const sourceVideoTrimKey = toSourceVideoTrimKey(input);
  const sourceVideoLinkLocalId = toCloudSourceVideoLinkLocalId({
    localAssetId: input.localAssetId,
    localShotId: input.localShotId,
    sourceVideoTrimKey
  });
  const shotSourceVideoLink = await bridge().cloud.links.get(
    "asset",
    sourceVideoLinkLocalId
  );
  const isShotSourceVideoLinkReusable = isCloudSourceVideoLinkReusable(
    shotSourceVideoLink,
    { sourceVideoTrimKey, cloudTimelineId: input.cloudTimelineId }
  );
  if (shotSourceVideoLink && isShotSourceVideoLinkReusable)
    return toCloudSourceVideo(shotSourceVideoLink);

  const hasShotEverLinkedThisSourceVideo = !!shotSourceVideoLink;
  const adoptedSourceVideo = hasShotEverLinkedThisSourceVideo
    ? null
    : await adoptAssetScopedCloudSourceVideoLink(api, {
        localAssetId: input.localAssetId,
        cloudTimelineId: input.cloudTimelineId,
        sourceVideoTrimKey,
        sourceVideoLinkLocalId
      });
  if (adoptedSourceVideo) return adoptedSourceVideo;

  // The trim is applied locally, so the metadata file that would tell ingestion
  // to trim is deliberately not written -- sending it would trim twice.
  input.onProgress?.("encoding");
  await bridge().cloud.prepareUpload({
    assetId: input.localAssetId,
    trimStartSeconds: input.trimStartSeconds,
    trimEndSeconds: input.trimEndSeconds
  });

  const registration = await api.post<Record<string, unknown>>(
    "/assets/video/upload",
    { name: input.name, ext: "mp4", timeline_id: input.cloudTimelineId }
  );
  const cloudAssetId = findUploadedAssetId(registration);
  const responseKeys = Object.keys(registration).sort().join(", ") || "none";
  if (!cloudAssetId)
    throw new Error(
      `Cloud Mago's video-upload response has no asset id (response keys: ${responseKeys})`
    );

  const videoUrl = registration.video_url;
  if (typeof videoUrl !== "string" || !videoUrl) {
    // The backend deliberately returns only the existing timeline when its
    // first clip already has a healthy asset. That asset is not an upload slot
    // for this local video; the caller must remap the shot to a fresh timeline.
    if (Object.hasOwn(registration, "timeline")) {
      throw new CloudTimelineOccupiedError();
    }
    throw new Error(
      `Cloud Mago did not return a video upload URL (response keys: ${responseKeys})`
    );
  }

  // The layer id is only in this response, and a render needs it as its input.
  const cloudLayerId = findUploadedLayerId(registration, cloudAssetId);
  await bridge().cloud.links.put({
    kind: "asset",
    localId: sourceVideoLinkLocalId,
    cloudId: cloudAssetId,
    data: {
      status: "uploading",
      sourceVideoTrimKey,
      cloudTimelineId: input.cloudTimelineId,
      ...(cloudLayerId ? { cloudLayerId } : {})
    }
  });

  input.onProgress?.("uploading");
  await bridge().cloud.uploadPrepared({
    assetId: input.localAssetId,
    trimStartSeconds: input.trimStartSeconds,
    trimEndSeconds: input.trimEndSeconds,
    presignedUrl: videoUrl
  });

  input.onProgress?.("ingesting");
  await api.post(`/assets/${cloudAssetId}/ingestion`, {});
  await bridge().cloud.links.patch({
    kind: "asset",
    localId: sourceVideoLinkLocalId,
    patch: { status: "processing" }
  });

  await waitForIngestion(api, cloudAssetId);

  await bridge().cloud.links.patch({
    kind: "asset",
    localId: sourceVideoLinkLocalId,
    patch: { status: "ingested" }
  });
  return {
    cloudAssetId,
    cloudLayerId,
    cloudSourceVideoLinkLocalId: sourceVideoLinkLocalId
  };
};

export const ensureCloudAsset = async (
  api: CloudApi,
  input: CloudSourceVideoRequest
): Promise<string> => (await ensureCloudSourceVideo(api, input)).cloudAssetId;

const fetchIngestionStatus = async (
  api: CloudApi,
  cloudAssetId: string
): Promise<AssetStatusResponse> => {
  try {
    return await api.get<AssetStatusResponse>(`/assets/${cloudAssetId}`);
  } catch (requestError) {
    const ingestionFailure = ingestionFailureFromRequestError(requestError);
    if (ingestionFailure) throw new Error(ingestionFailure);
    throw requestError;
  }
};

export const waitForIngestion = async (
  api: CloudApi,
  cloudAssetId: string,
  options: { attempts?: number; intervalMs?: number } = {}
): Promise<void> => {
  const attempts = options.attempts ?? INGESTION_POLL_ATTEMPTS;
  const intervalMs = options.intervalMs ?? INGESTION_POLL_INTERVAL_MS;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const response = await fetchIngestionStatus(api, cloudAssetId);
    const status = ingestionStatus(response);
    if (status === "ingested") return;
    if (status === "error" || status === "failed") {
      throw new Error(
        describeIngestionErrorPayload(response.asset?.data?.error)
      );
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error("Cloud ingestion did not finish in time");
};

/**
 * Walks the whole chain for one shot. Cheap after the first render, because each
 * step short-circuits on its cached link.
 */
export const ensureMirroredShot = async (
  api: CloudApi,
  input: {
    localProjectId: string;
    projectName: string;
    localShotId: string;
    shotName: string;
    localAssetId: string;
    assetName: string;
    trimStartSeconds?: number;
    trimEndSeconds?: number;
    onProgress?: MirrorProgress;
  }
): Promise<{
  cloudProjectId: string;
  cloudTimelineId: string;
  cloudAssetId: string;
  /** The layer holding the input video, needed as a render's source. */
  cloudLayerId: string | null;
  cloudSourceVideoLinkLocalId: string;
}> => {
  input.onProgress?.("project");
  const cloudProjectId = await ensureCloudProject(api, {
    localProjectId: input.localProjectId,
    name: input.projectName
  });

  input.onProgress?.("timeline");
  let cloudTimelineId = await ensureCloudTimeline(api, {
    localShotId: input.localShotId,
    localProjectId: input.localProjectId,
    cloudProjectId,
    name: input.shotName
  });

  input.onProgress?.("asset");
  const ensureSourceVideo = () =>
    ensureCloudSourceVideo(api, {
      localAssetId: input.localAssetId,
      localShotId: input.localShotId,
      cloudTimelineId,
      name: input.assetName,
      trimStartSeconds: input.trimStartSeconds,
      trimEndSeconds: input.trimEndSeconds,
      onProgress: input.onProgress
    });

  let sourceVideo: CloudSourceVideo;
  try {
    sourceVideo = await ensureSourceVideo();
  } catch (error) {
    if (!(error instanceof CloudTimelineOccupiedError)) throw error;

    input.onProgress?.("timeline");
    cloudTimelineId = await createCloudTimeline(api, {
      localShotId: input.localShotId,
      cloudProjectId,
      name: input.shotName
    });
    input.onProgress?.("asset");
    sourceVideo = await ensureSourceVideo();
  }

  input.onProgress?.("done");
  return { cloudProjectId, cloudTimelineId, ...sourceVideo };
};

/**
 * Mirrors a reference image so a render can point at it.
 *
 * A render's `sources` carries image asset ids -- reference frames, key frames,
 * an ipadapter source, a mask -- and they are local ids the cloud has never
 * seen, which it rejects with "Invalid source: asset not found or
 * inaccessible". Images need no encode, so this is register, upload, link.
 */
export const ensureCloudImageAsset = async (
  api: CloudApi,
  localAssetId: string,
  cloudProjectId?: string,
  onProgress?: MirrorProgress
): Promise<string> => {
  const existing = await bridge().cloud.links.get("asset", localAssetId);
  if (existing && isCloudAssetLinkReusable(existing)) return existing.cloudId;

  const info = await bridge().cloud.assetInfo(localAssetId);
  if (!info) throw new Error("The reference image could not be found locally");
  const cloudImageSize = toCloudImageSize(info);
  if (!cloudImageSize) {
    throw new Error(
      "The reference image's dimensions could not be read, so it cannot be sent to cloud Mago"
    );
  }

  onProgress?.("asset");
  const registered = await api.post<{
    asset?: { id?: unknown };
    s3_url?: unknown;
    thumbnail_s3_url?: unknown;
  }>("/assets/image/upload", {
    name: info.name,
    ext: toCloudImageExtension(info.extension),
    size: cloudImageSize,
    ...(cloudProjectId ? { project_id: cloudProjectId } : {})
  });
  const cloudAssetId = registered.asset?.id;
  const uploadUrl = registered.s3_url;
  const thumbnailUploadUrl = registered.thumbnail_s3_url;
  if (typeof cloudAssetId !== "string" || typeof uploadUrl !== "string") {
    throw new Error("Cloud Mago did not return an uploadable image asset");
  }

  onProgress?.("uploading");
  await bridge().cloud.uploadAsset({
    assetId: localAssetId,
    presignedUrl: uploadUrl
  });
  if (typeof thumbnailUploadUrl === "string" && thumbnailUploadUrl) {
    await bridge().cloud.uploadAsset({
      assetId: localAssetId,
      presignedUrl: thumbnailUploadUrl
    });
  }
  await bridge().cloud.links.put({
    kind: "asset",
    localId: localAssetId,
    cloudId: cloudAssetId,
    // Images are usable as soon as they are uploaded: no ingestion step.
    data: { status: "ingested", kind: "image" }
  });
  onProgress?.("done");
  return cloudAssetId;
};
