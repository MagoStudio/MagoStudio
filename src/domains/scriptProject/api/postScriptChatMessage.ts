import { backendApiClient } from "@/lib/backend-api-client";

import { ScriptChatRequestBody } from "../utils/buildScriptChatRequestBody";

export type PostScriptChatMessageResponse = {
  message_id: string;
  status: string;
};

export const postScriptChatMessage = async (
  requestBody: ScriptChatRequestBody
): Promise<PostScriptChatMessageResponse> => {
  const response = await backendApiClient.post<PostScriptChatMessageResponse>(
    `/chat/message`,
    requestBody
  );
  return response.data;
};
