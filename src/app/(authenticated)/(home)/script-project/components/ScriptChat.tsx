import { Text } from "@components/Text";
import { ScriptChatDisplayTurn } from "@domains/scriptProject/utils/mapScriptChatMessagesToTurns";
import { cn } from "@utils";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { ScriptChatInput } from "./ScriptChatInput";

interface Props {
  routeLabel?: string;
  messages: ScriptChatDisplayTurn[];
  draft: string;
  isWaitingForReply: boolean;
  isScriptLockedAfterSending: boolean;
  onDraftChange: (draft: string) => void;
  onSubmit: () => void;
}

const resolveTurnContent = (
  turn: ScriptChatDisplayTurn,
  t: (key: string) => string
): string => {
  if (turn.role === "user") return turn.text;

  switch (turn.kind) {
    case "reply":
      return turn.text;
    case "scriptUpdated":
      return t("script_project.chat.script_updated.label");
    case "failed":
      return t("script_project.chat.failed.description");
    case "emptyResponse":
      return t("script_project.chat.empty_response.label");
    case "insufficientBalance":
      return t("script_project.chat.insufficient_balance.label");
  }
};

export const ScriptChat: React.FC<Props> = ({
  routeLabel,
  messages,
  draft,
  isWaitingForReply,
  isScriptLockedAfterSending,
  onDraftChange,
  onSubmit
}) => {
  const { t } = useTranslation();
  const messageListRef = useRef<HTMLDivElement>(null);

  // oxlint-disable-next-line custom-react/no-use-effect -- external sync: the newest message only exists in the DOM after it renders, so the scroll position has to be set afterwards
  useEffect(() => {
    const messageList = messageListRef.current;
    if (!messageList) return;

    messageList.scrollTo({
      top: messageList.scrollHeight,
      behavior: "smooth"
    });
  }, [messages, isWaitingForReply]);

  return (
    <div
      data-testid="script-project-chat"
      className="flex h-full min-h-0 w-full flex-col gap-2 bg-surface-secondary p-3"
    >
      {routeLabel && (
        <Text variant="xs" color="glyph-secondary">
          {routeLabel}
        </Text>
      )}
      <div
        ref={messageListRef}
        className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto scrollbar-custom"
      >
        {messages.map((message, messageIndex) => {
          const content = resolveTurnContent(message, t);

          return (
            <div
              key={`${message.role}-${messageIndex}`}
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                data-testid={`script-chat-message-${messageIndex}`}
                className={cn(
                  message.role === "user" &&
                    "max-w-[85%] rounded-lg bg-element-primary p-2"
                )}
              >
                <Text
                  component="span"
                  variant="sm"
                  color="glyph-primary"
                  whiteSpace="pre-line"
                >
                  {content}
                </Text>
              </div>
            </div>
          );
        })}

        {isWaitingForReply && (
          <Text
            component="span"
            variant="sm"
            color="glyph-tertiary"
            data-testid="script-chat-thinking"
          >
            {t("script_project.chat.thinking.label")}
          </Text>
        )}
      </div>

      <ScriptChatInput
        value={draft}
        isSending={isWaitingForReply}
        isScriptLockedAfterSending={isScriptLockedAfterSending}
        onChange={onDraftChange}
        onSubmit={onSubmit}
      />
    </div>
  );
};
