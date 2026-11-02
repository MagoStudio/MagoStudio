import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { Textarea } from "@components/Textarea";
import { useTranslation } from "react-i18next";

interface Props {
  value: string;
  isSending: boolean;
  isScriptLockedAfterSending: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export const ScriptChatInput: React.FC<Props> = ({
  value,
  isSending,
  isScriptLockedAfterSending,
  onChange,
  onSubmit
}) => {
  const { t } = useTranslation();
  const canSubmit =
    !isSending && !isScriptLockedAfterSending && value.trim().length > 0;

  return (
    <div className="relative shadow-2xl">
      <Textarea
        data-testid="script-chat-input"
        className="field-sizing-content h-auto min-h-24 max-h-64 rounded-xl border-glyph-stroke py-3 pr-11 pl-3 text-glyph-primary"
        placeholder={t("script_project.chat.input_placeholder.label")}
        value={value}
        disabled={isSending || isScriptLockedAfterSending}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter" || event.shiftKey) return;
          event.preventDefault();
          if (canSubmit) onSubmit();
        }}
      />
      <div className="absolute right-2 bottom-2">
        <IconActionButton
          data-testid="script-chat-send"
          aria-label={t("script_project.chat.send.label")}
          icon={<Icon iconSet="16" iconName="return" />}
          isDisabled={!canSubmit}
          onPress={onSubmit}
        />
      </div>
    </div>
  );
};
