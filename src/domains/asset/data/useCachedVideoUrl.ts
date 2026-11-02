/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect for external sync */

import { useEffect, useState } from "react";

import { cacheVideoUrl } from "../utils/cacheVideoUrl";

interface CachedVideo {
  sourceUrl: string;
  objectUrl: string;
}

export const useCachedVideoUrl = (
  videoUrl: string | undefined
): string | undefined => {
  const [cachedVideo, setCachedVideo] = useState<CachedVideo | undefined>(
    undefined
  );

  /* eslint-disable react-you-might-not-need-an-effect/no-event-handler, react-you-might-not-need-an-effect/no-adjust-state-on-prop-change, react-you-might-not-need-an-effect/no-derived-state -- async cache + objectURL sync, not derivable in render */
  useEffect(() => {
    if (!videoUrl) return;

    const loadVideo = async () => {
      const { urlToUse } = await cacheVideoUrl(videoUrl, videoUrl);
      setCachedVideo({ sourceUrl: videoUrl, objectUrl: urlToUse });
    };

    void loadVideo();
  }, [videoUrl]);
  /* eslint-enable react-you-might-not-need-an-effect/no-event-handler, react-you-might-not-need-an-effect/no-adjust-state-on-prop-change, react-you-might-not-need-an-effect/no-derived-state */

  const objectUrl = cachedVideo?.objectUrl;

  useEffect(() => {
    return () => {
      if (objectUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  if (!cachedVideo || cachedVideo.sourceUrl !== videoUrl) {
    return undefined;
  }

  return cachedVideo.objectUrl;
};
