import { useToast } from "@store/useToast";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export const useUndoablePromptRewrite = ({
  value,
  onChange,
  rewritePrompt,
  rewriteFailedMessageKey
}: {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  rewritePrompt: (prompt: string) => Promise<string>;
  rewriteFailedMessageKey: string;
}) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const promptBeforeRewrite = useRef(value);
  const [latestRewrittenPrompt, setLatestRewrittenPrompt] = useState<
    string | undefined
  >(undefined);

  const rewrite = async () => {
    promptBeforeRewrite.current = value;

    try {
      const rewrittenPrompt = await rewritePrompt(value ?? "");
      onChange(rewrittenPrompt);
      setLatestRewrittenPrompt(rewrittenPrompt);
    } catch (error) {
      // The toast is intentionally user-friendly, but retaining the original
      // exception is essential for diagnosing cloud/auth/upload failures.
      console.error("Prompt rewrite failed", error);
      showToast({
        message: t(rewriteFailedMessageKey)
      });
    }
  };

  const undoRewrite = () => {
    onChange(promptBeforeRewrite.current);
  };

  const canUndoRewrite =
    latestRewrittenPrompt !== undefined && latestRewrittenPrompt === value;

  return {
    rewritePrompt: rewrite,
    undoRewritePrompt: undoRewrite,
    canUndoRewritePrompt: canUndoRewrite
  };
};
