import { BulkRendersRunStatus } from "@schemas/bulkRendersRun";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";

import { queryKeys } from "@/queryKeys";

import { postBulkRendersRunCancel } from "../api/postBulkRendersRunCancel";
import { isBulkRendersRunStatusTerminal } from "../utils/isBulkRendersRunStatusTerminal";

const HTTP_BAD_REQUEST = 400;

const CANCEL_REFUSED_STATE_MESSAGE_PATTERN =
  /^Cannot cancel plan in (.+) state$/;

const isAlreadyTerminalCancelResponseBody = (data: unknown): boolean => {
  const hasMessage =
    typeof data === "object" &&
    data !== null &&
    "message" in data &&
    typeof (data as { message: unknown }).message === "string";
  if (!hasMessage) return false;

  const refusedState = CANCEL_REFUSED_STATE_MESSAGE_PATTERN.exec(
    (data as { message: string }).message
  )?.[1];
  if (!refusedState) return false;

  return isBulkRendersRunStatusTerminal(refusedState as BulkRendersRunStatus);
};

export interface CancelBulkRendersRunInput {
  bulkRunId: string;
  projectId: string | undefined;
}

type CancelBulkRendersRunOutcome =
  | { kind: "cancelled" }
  | { kind: "alreadyTerminal" };

export const useCancelBulkRendersRun = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bulkRunId
    }: CancelBulkRendersRunInput): Promise<CancelBulkRendersRunOutcome> => {
      try {
        await postBulkRendersRunCancel(bulkRunId);
        return { kind: "cancelled" };
      } catch (error) {
        if (
          isAxiosError(error) &&
          error.response?.status === HTTP_BAD_REQUEST &&
          isAlreadyTerminalCancelResponseBody(error.response.data)
        ) {
          return { kind: "alreadyTerminal" };
        }
        throw error;
      }
    },
    onSuccess: (outcome, { bulkRunId, projectId }) => {
      if (outcome.kind === "alreadyTerminal") {
        void queryClient.refetchQueries({
          queryKey: queryKeys.bulkRendersRunProgress.byRunId(bulkRunId)
        });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.bulkRendersRuns.everyProject()
        });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.bulkRendersRuns.byProjectId(projectId)
        });
        return;
      }

      void queryClient.invalidateQueries({
        queryKey: queryKeys.bulkRendersRunProgress.byRunId(bulkRunId)
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.bulkRendersRunSteps.byRunId(bulkRunId)
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.bulkRendersRuns.everyProject()
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.bulkRendersRuns.byProjectId(projectId)
      });
    }
  });
};
