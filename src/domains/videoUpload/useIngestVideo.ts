import { syncCloudProjectMetadata } from "@domains/scriptProject/syncCloudScriptProjects";
import { usePublishVideoIngestionJob } from "@hooks/assets/usePublishVideoIngestionJob";
import { useAuth } from "@platform/identity";
import { useQueryClient } from "@tanstack/react-query";

import { getVideoAsset } from "../asset/getVideoAsset";
import { useCreateVideoAsset } from "../asset/useCreateVideoAsset";
import { useUploadAsset } from "../asset/useUploadAsset";
import { cacheSet } from "../asset/utils/cacheStorage";
import { handleVideoAssetCreation } from "../shot/handleVideoAssetCreation";

import { ingestVideo } from "./ingestVideo";
import { IngestVideoParams, IngestVideoResult } from "./types";
import { getIngestInvalidationKeys } from "./utils/getIngestInvalidationKeys";
import { waitForPollTick } from "./utils/waitForPollTick";

export const useIngestVideo = () => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  const { mutateAsync: createVideoAsset } = useCreateVideoAsset();
  const { mutateAsync: uploadAssetToS3 } = useUploadAsset();
  const { mutateAsync: publishIngestionJob } = usePublishVideoIngestionJob();

  const runIngestVideo = (
    params: IngestVideoParams
  ): Promise<IngestVideoResult> =>
    ingestVideo(params, {
      createVideoAsset: async ({ file, shotId }) => {
        const creation = await handleVideoAssetCreation({
          selectedFile: file,
          selectedShotId: shotId,
          createVideoAsset
        });

        if (!creation) {
          throw new Error("Error creating video asset");
        }

        return creation;
      },
      uploadAssetToS3,
      publishIngestionJob,
      fetchVideoAssetStatus: async (assetId) => {
        let clerkToken: string | null;
        try {
          clerkToken = await getToken({ template: "basicToken" });
        } catch {
          return undefined;
        }
        if (!clerkToken) return undefined;

        return getVideoAsset({ assetId, clerkToken });
      },
      invalidateAfterIngest: async (projectId) => {
        // The desktop app reads projects from its local mirror, which does not
        // know about the new shot until it is pulled back from the cloud.
        await syncCloudProjectMetadata(projectId).catch((error) => {
          console.warn(`Failed to mirror cloud project ${projectId}`, error);
        });
        await Promise.all(
          getIngestInvalidationKeys(projectId).map((queryKey) =>
            queryClient.invalidateQueries({ queryKey })
          )
        );
      },
      cacheVideoFile: (assetId, file) => cacheSet("video", assetId, file),
      waitForPollTick
    });

  return { ingestVideo: runIngestVideo };
};
