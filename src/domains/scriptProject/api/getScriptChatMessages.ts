import {
  GetScriptChatMessagesResponse,
  GetScriptChatMessagesResponseSchema
} from "@schemas/scriptProject";

import { backendApiClient } from "@/lib/backend-api-client";

const SCRIPT_CHAT_MESSAGES_LIMIT = 100;

export const getScriptChatMessages = async (
  projectId: string
): Promise<GetScriptChatMessagesResponse> => {
  const response = await backendApiClient.get(`/chat/message`, {
    params: { project_id: projectId, limit: SCRIPT_CHAT_MESSAGES_LIMIT }
  });
  return GetScriptChatMessagesResponseSchema.parse(response.data);
};
