import { backendApiClient } from "@/lib/backend-api-client";

import { EnhancePromptRequestBody, EnhancedPrompt } from "../interface";
import { TextModelRoute } from "../useTextModelRoute";

/** On the desktop app, `route` "cloud" sends it to Mago cloud's Gemini instead of
 *  the local VLM; the request and response are the same either way. */
export const postEnhancePrompt = async (
  requestBody: EnhancePromptRequestBody,
  route: TextModelRoute
) => {
  if (typeof window !== "undefined" && window.mago && route === "local") {
    return window.mago.vlm.enhancePrompt({
      query: requestBody.query,
      version: requestBody.version
    });
  }

  const response = await backendApiClient.post<EnhancedPrompt>(
    `/chat/enhance-prompt`,
    requestBody
  );

  return response.data;
};
