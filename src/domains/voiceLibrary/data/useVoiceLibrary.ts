import { MINUTE } from "@constants";
import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import { getVoiceLibrary } from "../api/getVoiceLibrary";

const VOICE_LIBRARY_STALE_TIME_MINUTES = 10;

export const useVoiceLibrary = ({ languageCode }: { languageCode: string }) =>
  useQuery({
    queryKey: queryKeys.voiceLibrary.byLanguageCode(languageCode),
    queryFn: () => getVoiceLibrary({ languageCode }),
    staleTime: VOICE_LIBRARY_STALE_TIME_MINUTES * MINUTE
  });
