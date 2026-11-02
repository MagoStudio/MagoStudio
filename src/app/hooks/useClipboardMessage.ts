import { useState } from "react";
export type MessageVariant = "error" | "success";

export interface ClipboardMessage {
  text: string;
  variant: MessageVariant;
}

export function useClipboardMessage() {
  const [message, setMessage] = useState<ClipboardMessage | null>(null);
  const showMessage = (text: string, variant: MessageVariant) => {
    setMessage({
      text,
      variant
    });
  };
  const resetMessage = () => {
    setMessage(null);
  };
  return {
    message,
    showMessage,
    resetMessage
  };
}
