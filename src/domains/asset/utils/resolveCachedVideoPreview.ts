import { extractFrameFromVideo } from "@app/services/mediaBunny";

import { cacheGet } from "./cacheStorage";
import { getFrameFromCache, saveFrameToCache } from "./frameCache";
import { getCachedVideoBlob } from "./getCachedVideoBlob";
import { isLocalVideoUrl } from "./isLocalVideoUrl";

const FIRST_FRAME_NUMBER = 0;

export interface CachedVideoPreview {
  videoObjectUrl: string | null;
  firstFrameUrl: string | null;
  isVideoAvailable: boolean;
}

/** A persisted first frame and, when requested, a playable local copy of a finished render.
 * Thumbnail-only reads return the saved frame without touching the video after the first visit.
 *
 * Keyed on the asset id rather than the URL: a render's URL can be reissued while the bytes
 * behind it never change, and re-downloading a finished render on every visit is what this
 * exists to stop.
 *
 * Playable object URLs are deliberately never revoked. Their Blobs are held by the query
 * that called this, so revoking would break replays without releasing the bytes — and handing
 * the URL back synchronously is what lets a warm cache fill a `src` on the first render,
 * before anything has started playing. Thumbnail-only reads do not create an object URL. */
export const resolveCachedVideoPreview = async ({
  assetId,
  videoUrl,
  fps,
  loadVideo = true
}: {
  assetId: string;
  videoUrl: string;
  fps: number;
  loadVideo?: boolean;
}): Promise<CachedVideoPreview> => {
  const cachedFirstFrameUrl = await getFrameFromCache(
    assetId,
    FIRST_FRAME_NUMBER,
    fps
  );

  // Thumbnail-only callers must not reopen or download the video when the
  // persisted first frame already exists.
  if (cachedFirstFrameUrl && !loadVideo) {
    const isVideoAvailable =
      isLocalVideoUrl(videoUrl) ||
      ((await cacheGet("video", assetId))?.size ?? 0) > 0;
    return {
      videoObjectUrl: null,
      firstFrameUrl: cachedFirstFrameUrl,
      isVideoAvailable
    };
  }

  const videoSource = isLocalVideoUrl(videoUrl)
    ? videoUrl
    : await getCachedVideoBlob(videoUrl, assetId);
  const videoObjectUrl = loadVideo
    ? typeof videoSource === "string"
      ? videoSource
      : URL.createObjectURL(videoSource)
    : null;

  if (cachedFirstFrameUrl)
    return {
      videoObjectUrl,
      firstFrameUrl: cachedFirstFrameUrl,
      isVideoAvailable: true
    };

  try {
    const extractedFirstFrameUrl = await extractFrameFromVideo({
      videoSource,
      frameNumber: FIRST_FRAME_NUMBER,
      fps
    });
    await saveFrameToCache(
      assetId,
      FIRST_FRAME_NUMBER,
      extractedFirstFrameUrl,
      fps
    );
    return {
      videoObjectUrl,
      firstFrameUrl: extractedFirstFrameUrl,
      isVideoAvailable: true
    };
  } catch {
    return { videoObjectUrl, firstFrameUrl: null, isVideoAvailable: true };
  }
};
