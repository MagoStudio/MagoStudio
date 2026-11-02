import { GhostButton } from "@components/GhostButton";
import { Message } from "@components/Message";
import { ClipboardMessage } from "@hooks/useCopyToClipboard";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  handleCopySettings: () => void;
  copyMessage: ClipboardMessage | null;
  resetCopyMessage: () => void;
  handlePasteSettings: () => void;
  pasteMessage: ClipboardMessage | null;
  resetPasteMessage: () => void;
}

export const CopyPasteButtonGroup: React.FC<Props> = ({
  handleCopySettings,
  copyMessage,
  resetCopyMessage,
  handlePasteSettings,
  pasteMessage,
  resetPasteMessage
}) => {
  const { t } = useTranslation();
  const copyButtonRef = useRef<HTMLDivElement | null>(null);
  const pasteButtonRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="flex gap-1 -mt-0.5">
      <div ref={copyButtonRef}>
        <GhostButton
          aria-label={t("actions.copy_settings.ariaLabel")}
          onPress={handleCopySettings}
        >
          {t("actions.copy_settings.label")}
        </GhostButton>
        {copyMessage && (
          <Message
            variant={copyMessage.variant}
            onDismiss={resetCopyMessage}
            anchorRef={copyButtonRef}
            placement="top"
          >
            {copyMessage.text}
          </Message>
        )}
      </div>
      <div ref={pasteButtonRef}>
        <GhostButton
          aria-label={t("actions.paste_settings.ariaLabel")}
          onPress={handlePasteSettings}
        >
          {t("actions.paste_settings.label")}
        </GhostButton>
        {pasteMessage && (
          <Message
            variant={pasteMessage.variant}
            onDismiss={resetPasteMessage}
            anchorRef={pasteButtonRef}
            placement="top"
          >
            {pasteMessage.text}
          </Message>
        )}
      </div>
    </div>
  );
};
