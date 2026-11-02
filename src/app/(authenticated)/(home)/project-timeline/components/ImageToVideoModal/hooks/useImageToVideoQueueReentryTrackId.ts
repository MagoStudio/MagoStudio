import { SELECTED_TRACK_IDS_URL_PARAM } from "@domains/track/selectedTrackIdsUrlParam";
import { useSearchParams } from "next/navigation";

export const useImageToVideoQueueReentryTrackId = (): string | undefined => {
  const searchParams = useSearchParams();
  const rawSelectedTrackIds = searchParams.get(SELECTED_TRACK_IDS_URL_PARAM);
  return rawSelectedTrackIds ? rawSelectedTrackIds.split(",")[0] : undefined;
};
