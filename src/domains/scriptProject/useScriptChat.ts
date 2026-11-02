import { useLatestRef } from "@hooks/useLatestRef";
import {
  AgentScriptDocument,
  ScriptChatMessageRow
} from "@schemas/scriptProject";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useGetScriptChatMessages } from "./data/useGetScriptChatMessages";
import { usePostScriptChatMessage } from "./data/usePostScriptChatMessage";
import { useReportScriptProjectFailure } from "./useReportScriptProjectFailure";
import { useSaveProjectSettingsPatch } from "./useSaveProjectSettingsPatch";
import { buildAgentScriptText } from "./utils/buildAgentScriptText";
import { neutralizeScriptChatClosingDelimiter } from "./utils/buildScriptChatMessage";
import { mapScriptChatMessagesToTurns } from "./utils/mapScriptChatMessagesToTurns";
import { parseScriptChatResponse } from "./utils/parseScriptChatResponse";
import { shouldApplyDeliveredScript } from "./utils/shouldApplyDeliveredScript";
import { splitScriptChatMessage } from "./utils/splitScriptChatMessage";

const findNewestRowOfRole = (
  rows: ScriptChatMessageRow[],
  role: ScriptChatMessageRow["role"],
  beforeIndex = rows.length
): ScriptChatMessageRow | undefined =>
  rows
    .slice(0, beforeIndex)
    .reverse()
    .find((row) => row.role === role);

export const useScriptChat = ({
  projectId,
  scriptBoxText,
  onScriptWritten,
  onRefusal,
  onFailedMessageResent,
  beforeSend
}: {
  projectId: string;
  scriptBoxText: string;
  onScriptWritten: (document: AgentScriptDocument) => void;
  onRefusal: (userText: string) => void;
  onFailedMessageResent: (userText: string) => void;
  beforeSend?: () => Promise<boolean>;
}) => {
  const { t } = useTranslation();
  const { project, saveProjectSettingsPatch } =
    useSaveProjectSettingsPatch(projectId);
  const hasProjectLoaded = project !== undefined;
  const reportScriptProjectFailure = useReportScriptProjectFailure();

  const [showInsufficientBalanceNotice, setShowInsufficientBalanceNotice] =
    useState(false);

  const {
    data: chatMessagesResponse,
    isError: hasScriptChatMessagesError,
    error: scriptChatMessagesError,
    refetch: refetchScriptChatMessages
  } = useGetScriptChatMessages(projectId);
  const rows = chatMessagesResponse?.messages ?? [];
  const isReplyPending =
    !hasScriptChatMessagesError && (chatMessagesResponse?.pending ?? false);

  const scriptBoxTextRef = useLatestRef(scriptBoxText);
  const beforeSendRef = useLatestRef(beforeSend);

  const hasReportedScriptChatMessagesErrorRef = useRef(false);

  // oxlint-disable-next-line custom-react/no-use-effect -- external sync: reports a poll failure once via the shared toast, matching useScriptProjectRun's progress-poll-error handling
  useEffect(() => {
    if (!hasScriptChatMessagesError) {
      hasReportedScriptChatMessagesErrorRef.current = false;
      return;
    }
    if (hasReportedScriptChatMessagesErrorRef.current) return;
    hasReportedScriptChatMessagesErrorRef.current = true;

    // oxlint-disable-next-line react-you-might-not-need-an-effect/no-pass-data-to-parent -- reporting the poll failure IS the effect
    reportScriptProjectFailure(
      scriptChatMessagesError,
      t("script_project.chat.failed.description"),
      () => void refetchScriptChatMessages()
    );
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- reportScriptProjectFailure/t are read fresh each run
  }, [hasScriptChatMessagesError, scriptChatMessagesError]);

  // oxlint-disable-next-line custom-react/no-use-effect -- external sync: applies a script the Agent delivered while the tab was closed, evaluated on mount and again whenever a poll brings fresh rows or the Project finishes loading
  useEffect(() => {
    if (!hasProjectLoaded) return;

    const newestAssistantRow = findNewestRowOfRole(rows, "assistant");
    if (!newestAssistantRow || newestAssistantRow.status !== "COMPLETED") {
      return;
    }

    const outcome = parseScriptChatResponse(newestAssistantRow);
    if (outcome.kind !== "script") return;

    const newestAssistantIndex = rows.indexOf(newestAssistantRow);
    const precedingUserRow = findNewestRowOfRole(
      rows,
      "user",
      newestAssistantIndex
    );
    const embeddedScriptInPrecedingUserMessage = precedingUserRow
      ? splitScriptChatMessage(precedingUserRow.content).embeddedScript
      : undefined;

    const deliveredScript = buildAgentScriptText(outcome.document);

    if (
      !shouldApplyDeliveredScript({
        deliveredScript,
        embeddedScriptInPrecedingUserMessage,
        scriptBoxText: neutralizeScriptChatClosingDelimiter(
          scriptBoxTextRef.current
        )
      })
    ) {
      return;
    }

    // oxlint-disable-next-line react-you-might-not-need-an-effect/no-pass-data-to-parent -- applying and saving the delivered script IS the effect
    onScriptWritten(outcome.document);
    saveProjectSettingsPatch({
      agent_script: deliveredScript,
      agent_script_document: outcome.document
    });
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed on `rows` and `hasProjectLoaded` alone: `scriptBoxTextRef` reads the latest box text without retriggering on every keystroke, and `onScriptWritten`/`saveProjectSettingsPatch` are read fresh each run
  }, [rows, hasProjectLoaded]);

  const { mutate: postScriptChatMessage, isPending: isSendPending } =
    usePostScriptChatMessage({
      onInsufficientBalance: (request) => {
        setShowInsufficientBalanceNotice(true);
        onRefusal(request.userInput);
      },
      onOtherError: (error, request) => {
        reportScriptProjectFailure(
          error,
          t("script_project.chat.failed.description"),
          async () => {
            if (beforeSendRef.current && !(await beforeSendRef.current()))
              return;
            onFailedMessageResent(request.userInput);
            postScriptChatMessage(request);
          }
        );
        onRefusal(request.userInput);
      }
    });

  const isWaitingForReply = isSendPending || isReplyPending;

  const sendMessage = async (userInput: string, currentScript?: string) => {
    const trimmedUserInput = userInput.trim();
    if (!trimmedUserInput || isWaitingForReply) return false;
    if (beforeSend && !(await beforeSend())) return false;

    setShowInsufficientBalanceNotice(false);
    postScriptChatMessage({
      projectId,
      userInput: trimmedUserInput,
      currentScript
    });
    return true;
  };

  const messages = [
    ...mapScriptChatMessagesToTurns(rows),
    ...(showInsufficientBalanceNotice
      ? [{ role: "assistant" as const, kind: "insufficientBalance" as const }]
      : [])
  ];

  return { messages, isWaitingForReply, sendMessage };
};
