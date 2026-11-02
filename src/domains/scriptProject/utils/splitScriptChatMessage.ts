import {
  CURRENT_SCRIPT_TURN_CLOSING_DELIMITER,
  CURRENT_SCRIPT_TURN_PREFIX
} from "./buildScriptChatMessage";

export const splitScriptChatMessage = (
  message: string
): { embeddedScript?: string; userText: string } => {
  if (!message.startsWith(CURRENT_SCRIPT_TURN_PREFIX)) {
    return { userText: message };
  }

  const afterPrefix = message.slice(CURRENT_SCRIPT_TURN_PREFIX.length);
  const delimiterIndex = afterPrefix.indexOf(
    CURRENT_SCRIPT_TURN_CLOSING_DELIMITER
  );
  if (delimiterIndex === -1) return { userText: message };

  return {
    embeddedScript: afterPrefix.slice(0, delimiterIndex),
    userText: afterPrefix.slice(
      delimiterIndex + CURRENT_SCRIPT_TURN_CLOSING_DELIMITER.length
    )
  };
};
