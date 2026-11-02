/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect for external sync */

import { useEffect, useState } from "react";

import { cacheImageUrl } from "../utils/cacheImageUrl";

import { useAssetDownloadPriority } from "./useAssetDownloadPriority";

interface CachedImage {
  sourceUrl: string;
  objectUrl: string;
}

export const useCachedImageUrl = (
  imageUrl: string | undefined,
  cacheKey: string,
  enabled = true
): string | undefined => {
  useAssetDownloadPriority(
    cacheKey.replace(/_thumb$/, ""),
    enabled && !!imageUrl
  );
  const [cachedImage, setCachedImage] = useState<CachedImage | undefined>(
    undefined
  );

  /* eslint-disable react-you-might-not-need-an-effect/no-event-handler, react-you-might-not-need-an-effect/no-adjust-state-on-prop-change, react-you-might-not-need-an-effect/no-derived-state -- async cache + objectURL sync, not derivable in render */
  useEffect(() => {
    if (!enabled || !imageUrl) return;

    /* Two loads overlap whenever the URL changes mid-flight — a card that starts on a full-size
     * image and switches to its thumbnail does it every time — and the slower one can land last.
     * Without this flag that stale write parked the hook on a URL no longer being asked for, the
     * guard below then returned undefined for good, and the revoke effect released the blob that
     * was actually on screen. */
    let isLoadStillWanted = true;

    const loadImage = async () => {
      const { urlToUse } = await cacheImageUrl(imageUrl, cacheKey);

      if (!isLoadStillWanted) {
        /* Every success path mints a fresh object URL, so dropping it silently would leak it. */
        if (urlToUse.startsWith("blob:")) URL.revokeObjectURL(urlToUse);
        return;
      }

      setCachedImage({ sourceUrl: imageUrl, objectUrl: urlToUse });
    };

    void loadImage();

    return () => {
      isLoadStillWanted = false;
    };
  }, [imageUrl, cacheKey, enabled]);
  /* eslint-enable react-you-might-not-need-an-effect/no-event-handler, react-you-might-not-need-an-effect/no-adjust-state-on-prop-change, react-you-might-not-need-an-effect/no-derived-state */

  const objectUrl = cachedImage?.objectUrl;

  useEffect(() => {
    return () => {
      if (objectUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  if (!enabled || !cachedImage || cachedImage.sourceUrl !== imageUrl)
    return undefined;

  return cachedImage.objectUrl;
};
