import { detectVideoHasAudioTrack } from "@app/services/mediaBunny/detectVideoHasAudioTrack";
import { useSelectedTrackIds } from "@domains/track/useSelectedTrackIds";
import { currentVideoSrcAtom } from "@store/atoms";
import { useQueries } from "@tanstack/react-query";
import { useAtomValue } from "jotai";

import { queryKeys } from "@/queryKeys";

export const usePreviewHasAudioTrack = () => {
  const currentVideoSrc = useAtomValue(currentVideoSrcAtom);
  const previewedTrackIds = useSelectedTrackIds();

  const videoSrcs = [
    ...new Set(previewedTrackIds.map((trackId) => currentVideoSrc[trackId]))
  ].filter(Boolean);

  const results = useQueries({
    queries: videoSrcs.map((videoSrc) => ({
      queryKey: queryKeys.videoHasAudioTrack.bySrc(videoSrc),
      queryFn: () => detectVideoHasAudioTrack(videoSrc),
      staleTime: Infinity,
      retry: false
    }))
  });

  const isResolved = videoSrcs.length > 0 && results.every((r) => r.isSuccess);
  const hasAudioTrack = isResolved
    ? results.some((r) => r.data === true)
    : true;

  return { hasAudioTrack, isResolved };
};
