import { MINUTE } from "@constants";
import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import { getVoicePreviewUrl } from "../api/getVoicePreviewUrl";

const SIGNED_PREVIEW_URL_STALE_TIME_MINUTES = 10;

export const useFetchVoicePreviewUrl = () => {
  const queryClient = useQueryClient();
  return (voiceId: string) =>
    queryClient.fetchQuery({
      queryKey: queryKeys.voicePreviewUrl.byVoiceId(voiceId),
      queryFn: () => getVoicePreviewUrl(voiceId),
      staleTime: SIGNED_PREVIEW_URL_STALE_TIME_MINUTES * MINUTE
    });
};
