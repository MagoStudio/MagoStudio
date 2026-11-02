import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import { getScriptChatMessages } from "../api/getScriptChatMessages";

const SCRIPT_CHAT_POLL_INTERVAL_MS = 2000;

export const useGetScriptChatMessages = (
  projectId: string | null | undefined
) =>
  useQuery({
    queryKey: queryKeys.scriptChatMessages.byProjectId(projectId),
    queryFn: () => getScriptChatMessages(projectId!),
    enabled: !!projectId,
    refetchInterval: (query) =>
      query.state.status === "error"
        ? false
        : query.state.data?.pending
          ? SCRIPT_CHAT_POLL_INTERVAL_MS
          : false
  });
