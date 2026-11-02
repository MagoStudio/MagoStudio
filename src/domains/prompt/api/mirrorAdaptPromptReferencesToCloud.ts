import { backendCloudApi } from "@domains/cloud/backendCloudApi";
import {
  CloudApi,
  ensureCloudImageAsset,
  ensureMirroredShot,
  MirrorProgress
} from "@domains/cloud/mirrorService";
import { resolveRenderContext } from "@domains/cloud/resolveRenderContext";

import { getLocalDesktopApi } from "@/platform/localDesktop";

import { MirroredAdaptPromptReference } from "../utils/adaptWithStaleCloudReferencesReplaced";

const mirrorReferenceImages = (
  api: CloudApi,
  referenceImageAssetIds: string[],
  cloudProjectId?: string,
  onProgress?: MirrorProgress
): Promise<MirroredAdaptPromptReference[]> =>
  Promise.all(
    referenceImageAssetIds.map(async (localAssetId) => ({
      localAssetId,
      cloudAssetId: await ensureCloudImageAsset(
        api,
        localAssetId,
        cloudProjectId,
        onProgress
      )
    }))
  );

export interface MirroredSourceVideoContext {
  localAssetId: string;
  cloudSourceVideoLinkLocalId: string;
  cloudAssetId: string;
  cloudProjectId: string;
}

/**
 * Resolves and mirrors the source video's shot once, so a retry after a stale
 * reference only has to re-mirror that one asset instead of re-scanning the
 * whole local library. See the stale-reference retry loop in
 * adaptWithStaleCloudReferencesReplaced.ts.
 */
export const resolveMirroredSourceVideoContext = async ({
  sourceVideoTrackId,
  onProgress
}: {
  sourceVideoTrackId: string;
  onProgress?: MirrorProgress;
}): Promise<MirroredSourceVideoContext> => {
  const api = backendCloudApi();
  const projects = await getLocalDesktopApi().projects.listAll();
  const context = resolveRenderContext(projects, {
    outputTrackId: sourceVideoTrackId,
    inputTrackId: sourceVideoTrackId
  });
  if (!context)
    throw new Error("The source video could not be prepared for the cloud");

  const mirrored = await ensureMirroredShot(api, {
    localProjectId: context.projectId,
    projectName: context.projectName,
    localShotId: context.shotId,
    shotName: context.shotName,
    localAssetId: context.assetId,
    assetName: context.assetName,
    onProgress
  });
  return {
    localAssetId: context.assetId,
    cloudSourceVideoLinkLocalId: mirrored.cloudSourceVideoLinkLocalId,
    cloudAssetId: mirrored.cloudAssetId,
    cloudProjectId: mirrored.cloudProjectId
  };
};

export const mirrorAdaptPromptReferencesToCloud = async ({
  sourceVideoContext,
  referenceImageAssetIds,
  onProgress
}: {
  sourceVideoContext: MirroredSourceVideoContext | undefined;
  referenceImageAssetIds: string[];
  onProgress?: MirrorProgress;
}): Promise<MirroredAdaptPromptReference[]> => {
  const api = backendCloudApi();
  const referenceImages = await mirrorReferenceImages(
    api,
    referenceImageAssetIds,
    sourceVideoContext?.cloudProjectId,
    onProgress
  );
  if (!sourceVideoContext) return referenceImages;
  return [
    {
      localAssetId: sourceVideoContext.localAssetId,
      cloudAssetId: sourceVideoContext.cloudAssetId
    },
    ...referenceImages
  ];
};
