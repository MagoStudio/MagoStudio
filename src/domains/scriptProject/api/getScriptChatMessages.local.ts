import {
  GetScriptChatMessagesResponse,
  GetScriptChatMessagesResponseSchema
} from "@schemas/scriptProject";

import { backendApiClient } from "@/lib/backend-api-client";
import { getLocalDesktopApi } from "@/platform/localDesktop";

import { isLocalScriptProject } from "../projectOrigin";

const SCRIPT_CHAT_MESSAGES_LIMIT = 100;

export const getScriptChatMessages = async (
  projectId: string
): Promise<GetScriptChatMessagesResponse> => {
  if (await isLocalScriptProject(projectId)) {
    return GetScriptChatMessagesResponseSchema.parse(
      await getLocalDesktopApi().scriptProjects.chatMessages({
        projectId,
        limit: SCRIPT_CHAT_MESSAGES_LIMIT
      })
    );
  }
  const response = await backendApiClient.get(`/chat/message`, {
    params: { project_id: projectId, limit: SCRIPT_CHAT_MESSAGES_LIMIT }
  });
  return GetScriptChatMessagesResponseSchema.parse(response.data);
};
