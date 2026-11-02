import { VideoAssetCreationData } from "@hooks/assets/interface";
import { useMutation } from "@tanstack/react-query";

import { backendApiClient } from "@/lib/backend-api-client";

interface CreateVideoAssetParams {
  originalFileName: string;
  extension: string;
  timelineId: string;
}

const createVideoAsset = async (
  params: CreateVideoAssetParams
): Promise<VideoAssetCreationData> => {
  const response = await backendApiClient.post<VideoAssetCreationData>(
    `/assets/video/upload`,
    {
      name: params.originalFileName,
      ext: params.extension,
      timeline_id: params.timelineId
    }
  );

  return response.data;
};

export const useCreateVideoAsset = () => {
  const mutation = useMutation<
    VideoAssetCreationData,
    Error,
    CreateVideoAssetParams
  >({
    mutationFn: createVideoAsset
  });

  return mutation;
};
