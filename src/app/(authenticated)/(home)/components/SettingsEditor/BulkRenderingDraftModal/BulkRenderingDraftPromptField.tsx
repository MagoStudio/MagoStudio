import { Text } from "@components/Text";
import { Textarea } from "@components/Textarea";
import { useTranslation } from "react-i18next";

export function BulkRenderingDraftPromptField({
  shotName,
  value,
  onChange,
  minHeightClassName,
  actions,
  disabled
}: {
  shotName: string;
  value: string;
  onChange: (value: string) => void;
  minHeightClassName: string;
  actions?: React.ReactNode;
  disabled?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex w-full flex-col gap-1">
      <div className="flex h-6 items-center justify-between gap-2">
        <Text component="span" variant="sm" color="glyph-tertiary">
          {t("bulk_rendering.draft_shot_card_prompt_label.label")}
        </Text>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <Textarea
        resize="vertical"
        className={minHeightClassName}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        aria-label={t("bulk_rendering.draft_shot_card_prompt_field.ariaLabel", {
          shotName
        })}
      />
    </div>
  );
}
