import { useCloudSyncProgressToast } from "@domains/cloud/useCloudSyncProgressToast";
import { VideoEngine } from "@models/video/types";

import { markCloudAssetLinkStale } from "./api/markCloudAssetLinkStale";
import { useMirrorAdaptPromptReferencesToCloud } from "./data/useMirrorAdaptPromptReferencesToCloud";
import { usePostAdaptI2vPrompt } from "./data/usePostAdaptI2vPrompt";
import { useResolveMirroredSourceVideoContext } from "./data/useResolveMirroredSourceVideoContext";
import { useUndoablePromptRewrite } from "./useUndoablePromptRewrite";
import { adaptWithStaleCloudReferencesReplaced } from "./utils/adaptWithStaleCloudReferencesReplaced";

export const useCloudAdaptableI2vPromptFromLocal = ({
  value,
  onChange,
  sourceVideoTrackId,
  referenceImageAssetIds,
  cloudEngine
}: {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  sourceVideoTrackId: string | undefined;
  referenceImageAssetIds: string[];
  cloudEngine: VideoEngine;
}) => {
  const {
    mutateAsync: mirrorReferencesToCloud,
    isPending: isMirroringReferences
  } = useMirrorAdaptPromptReferencesToCloud();
  const {
    mutateAsync: resolveSourceVideoContext,
    isPending: isResolvingSourceVideoContext
  } = useResolveMirroredSourceVideoContext();
  const { mutateAsync: adaptI2vPrompt, isPending: isAdaptingOnCloud } =
    usePostAdaptI2vPrompt();
  const { onProgress: onCloudSyncProgress, dismiss: dismissCloudSyncToast } =
    useCloudSyncProgressToast();

  const {
    rewritePrompt: adaptPrompt,
    undoRewritePrompt: undoAdaptPrompt,
    canUndoRewritePrompt: canUndoAdaptPrompt
  } = useUndoablePromptRewrite({
    value,
    onChange,
    rewritePrompt: async (prompt) => {
      // A single Optimize action can mirror both a source video and several
      // reference images. Individual mirror helpers report "done" separately;
      // keep one sync toast open until the complete action finishes instead.
      const reportCloudSyncProgress: typeof onCloudSyncProgress = (step) => {
        if (step !== "done") onCloudSyncProgress(step);
      };

      try {
        let sourceVideoContext = sourceVideoTrackId
          ? await resolveSourceVideoContext({
              sourceVideoTrackId,
              onProgress: reportCloudSyncProgress
            })
          : undefined;
        return await adaptWithStaleCloudReferencesReplaced({
          mirrorReferences: () =>
            mirrorReferencesToCloud({
              sourceVideoContext,
              referenceImageAssetIds,
              onProgress: reportCloudSyncProgress
            }),
          adapt: (cloudAssetIds) =>
            adaptI2vPrompt({
              prompt,
              reference_asset_ids: cloudAssetIds,
              engine: cloudEngine
            }),
          markReferenceStale: async (localAssetId) => {
            const isStaleSourceVideo =
              sourceVideoTrackId &&
              localAssetId === sourceVideoContext?.localAssetId;
            await markCloudAssetLinkStale(
              isStaleSourceVideo && sourceVideoContext
                ? sourceVideoContext.cloudSourceVideoLinkLocalId
                : localAssetId
            );
            if (isStaleSourceVideo)
              sourceVideoContext = await resolveSourceVideoContext({
                sourceVideoTrackId,
                onProgress: reportCloudSyncProgress
              });
          }
        });
      } finally {
        dismissCloudSyncToast();
      }
    },
    rewriteFailedMessageKey: "notifications.adapt_prompt_failed.description"
  });

  return {
    adaptPrompt,
    undoAdaptPrompt,
    // Resolving the source context can encode, upload and ingest the source
    // video before the adaptation request is sent. Keep the button visibly
    // busy for that whole operation, not only for the final two mutations.
    isAdaptingPrompt:
      isResolvingSourceVideoContext ||
      isMirroringReferences ||
      isAdaptingOnCloud,
    canUndoAdaptPrompt
  };
};
