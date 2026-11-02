import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";

import { queryKeys } from "@/queryKeys";

import { postScriptChatMessage } from "../api/postScriptChatMessage";
import { buildScriptChatRequestBody } from "../utils/buildScriptChatRequestBody";

const HTTP_PAYMENT_REQUIRED = 402;
const HTTP_CONFLICT = 409;

export type PostScriptChatMessageRequest = {
  projectId: string;
  userInput: string;
  currentScript?: string;
};

const isReplyAlreadyInFlightError = (error: unknown): boolean =>
  isAxiosError(error) && error.response?.status === HTTP_CONFLICT;

export const usePostScriptChatMessage = (options?: {
  onInsufficientBalance?: (request: PostScriptChatMessageRequest) => void;
  onOtherError?: (
    error: unknown,
    request: PostScriptChatMessageRequest
  ) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: PostScriptChatMessageRequest) => {
      try {
        return await postScriptChatMessage(buildScriptChatRequestBody(request));
      } catch (error) {
        if (isReplyAlreadyInFlightError(error)) {
          return { message_id: "", status: "accepted" };
        }
        throw error;
      }
    },
    onSuccess: (_data, request) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.scriptChatMessages.byProjectId(request.projectId)
      });
    },
    onError: (error, request) => {
      if (
        isAxiosError(error) &&
        error.response?.status === HTTP_PAYMENT_REQUIRED
      ) {
        options?.onInsufficientBalance?.(request);
        return;
      }
      options?.onOtherError?.(error, request);
    }
  });
};
