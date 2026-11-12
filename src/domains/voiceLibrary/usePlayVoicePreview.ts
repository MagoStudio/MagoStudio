import { useRef } from "react";

import { useFetchVoicePreviewUrl } from "./data/useFetchVoicePreviewUrl";
import { didProviderPreviewFailToLoad } from "./utils/didProviderPreviewFailToLoad";

export type VoicePreviewSource = {
  voiceId: string;
  providerPreviewUrl: string | null | undefined;
};

const playAudioFromStart = async (audio: HTMLAudioElement, url: string) => {
  audio.src = url;
  audio.currentTime = 0;
  await audio.play();
};

export const usePlayVoicePreview = () => {
  const fetchVoicePreviewUrl = useFetchVoicePreviewUrl();
  const latestPlaybackRequestIdRef = useRef(0);

  const stopVoicePreview = (audio: HTMLAudioElement) => {
    latestPlaybackRequestIdRef.current++;
    audio.pause();
    audio.currentTime = 0;
  };

  const playVoicePreview = async (
    audio: HTMLAudioElement,
    { voiceId, providerPreviewUrl }: VoicePreviewSource
  ): Promise<boolean> => {
    const playbackRequestId = ++latestPlaybackRequestIdRef.current;
    const isLatestPlaybackRequest = () =>
      playbackRequestId === latestPlaybackRequestIdRef.current;
    try {
      if (providerPreviewUrl) {
        try {
          await playAudioFromStart(audio, providerPreviewUrl);
          return true;
        } catch (err) {
          const shouldFallBackToBackendPreview =
            didProviderPreviewFailToLoad({
              playRejectionError: err,
              audioHasMediaError: audio.error !== null
            }) && isLatestPlaybackRequest();
          if (!shouldFallBackToBackendPreview) throw err;
        }
      }
      const backendPreviewUrl = await fetchVoicePreviewUrl(voiceId);
      if (!isLatestPlaybackRequest()) return false;
      await playAudioFromStart(audio, backendPreviewUrl);
      return true;
    } catch {
      if (isLatestPlaybackRequest()) audio.pause();
      return false;
    }
  };

  return { playVoicePreview, stopVoicePreview };
};
