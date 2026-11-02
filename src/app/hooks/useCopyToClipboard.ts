import { useTranslation } from "react-i18next";

import {
  ClipboardMessage,
  MessageVariant,
  useClipboardMessage
} from "./useClipboardMessage";

export type { ClipboardMessage };

export const useCopyToClipboard = () => {
  const { t } = useTranslation();
  const { message, showMessage, resetMessage } = useClipboardMessage();
  const copyToClipboard = async (
    text: string,
    showNotification: boolean = true
  ) => {
    const notify = (messageKey: string, variant: MessageVariant) => {
      if (!showNotification) return;
      showMessage(t(messageKey), variant);
    };
    try {
      if (!text?.trim()) {
        notify("notifications.nothing_to_copy.description", "error");
        return false;
      }

      await navigator.clipboard.writeText(text);

      notify("notifications.copied_to_clipboard.description", "success");

      return true;
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      notify("notifications.failed_to_copy_to_clipboard.description", "error");
      return false;
    }
  };
  return {
    copyToClipboard,
    message,
    resetMessage
  };
};
