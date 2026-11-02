import { Img2ImgRenderStatus } from "@models/img2img/types";
import { useQuery } from "@tanstack/react-query";

import { backendApiClient } from "@/lib/backend-api-client";
import { queryKeys } from "@/queryKeys";

import { toLocalImg2ImgRenderStatus } from "./utils/toLocalImg2ImgRenderStatus";

const REFETCH_INTERVAL_MS = 5000;

interface Img2ImgRenderStatusResponse {
  data: {
    frame: number;
    generated_at: string;
    status: string;
    settings: Record<string, any>;
    source_asset: string;
    source: string;
  };
  output_url?: string;
  progress?: number;
  render_status: Img2ImgRenderStatus;
  thumbnail_url?: string;
}

const getImg2ImgRenderStatus = async (
  clipId: string
): Promise<Img2ImgRenderStatusResponse> => {
  if (typeof window !== "undefined" && window.mago) {
    const localQueueItem =
      (await window.mago.imageRenders.listQueue()).find(
        (candidate) => candidate.clip_id === clipId
      ) ??
      (await window.mago.cloud.renders.listQueue()).find(
        (candidate) => candidate.clip_id === clipId
      );
    if (!localQueueItem) throw new Error("Local image render not found");
    const localRenderStatus = toLocalImg2ImgRenderStatus(localQueueItem);
    return {
      ...localRenderStatus,
      data: localRenderStatus.data as Img2ImgRenderStatusResponse["data"]
    };
  }
  const response = await backendApiClient.get(
    `/assets/img2img/status/${clipId}`
  );
  return response.data;
};

const completedStatuses = [
  Img2ImgRenderStatus.SUCCESS,
  Img2ImgRenderStatus.FAILED,
  Img2ImgRenderStatus.CANCELLED,
  Img2ImgRenderStatus.TIMEOUT
];

export const useGetImg2ImgRenderStatus = ({
  clipId,
  enabled = true
}: {
  clipId?: string;
  enabled?: boolean;
}) => {
  const queryResult = useQuery({
    queryKey: queryKeys.img2imgStatus.byClipId(clipId),
    queryFn: () => getImg2ImgRenderStatus(clipId!),
    enabled: enabled && !!clipId,
    refetchInterval: (query) => {
      if (
        query.state.data?.render_status &&
        completedStatuses.includes(
          query.state.data.render_status as Img2ImgRenderStatus
        )
      ) {
        return false;
      }
      return REFETCH_INTERVAL_MS;
    },
    refetchIntervalInBackground: false,
    staleTime: Infinity,
    gcTime: Infinity
  });

  return queryResult;
};
