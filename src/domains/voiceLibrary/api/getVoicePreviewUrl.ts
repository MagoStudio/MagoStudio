import { z } from "zod";

import { backendApiClient } from "@/lib/backend-api-client";

const VoicePreviewSchema = z.object({ url: z.string() });

export const getVoicePreviewUrl = async (voiceId: string): Promise<string> => {
  const response = await backendApiClient.get("/voices/preview", {
    params: { voice_id: voiceId }
  });
  return VoicePreviewSchema.parse(response.data).url;
};
