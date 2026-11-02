import { backendApiClient } from "@/lib/backend-api-client";
import { getLocalDesktopApi } from "@/platform/localDesktop";

import { isLocalScriptProject } from "../projectOrigin";
import { ScriptChatRequestBody } from "../utils/buildScriptChatRequestBody";

export type PostScriptChatMessageResponse = {
  message_id: string;
  status: string;
};

/** Local transcripts stay on the desktop; its worker selects local Qwen or
 *  standalone cloud Gemini. Cloud projects use their cloud transcript. */
export const postScriptChatMessage = async (
  requestBody: ScriptChatRequestBody
): Promise<PostScriptChatMessageResponse> => {
  if (await isLocalScriptProject(requestBody.project_id)) {
    return getLocalDesktopApi().scriptProjects.chatMessage({
      projectId: requestBody.project_id,
      message: requestBody.message,
      systemPrompt: requestBody.system_prompt,
      tools: requestBody.tools
    });
  }
  const response = await backendApiClient.post<PostScriptChatMessageResponse>(
    `/chat/message`,
    requestBody
  );
  return response.data;
};
