import { StockVoiceSchema } from "@schemas/voiceLibrary";
import { z } from "zod";

import { backendApiClient } from "@/lib/backend-api-client";

const VoiceLibrarySchema = z.object({
  library: z.array(StockVoiceSchema).default([]),
  library_error: z.string().nullable().optional()
});

export type VoiceLibrary = z.infer<typeof VoiceLibrarySchema>;

export const getVoiceLibrary = async ({
  languageCode
}: {
  languageCode: string;
}): Promise<VoiceLibrary> => {
  const response = await backendApiClient.get("/voices", {
    params: { language: languageCode }
  });
  return VoiceLibrarySchema.parse(response.data);
};
