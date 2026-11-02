import { Icon } from "@components/Icon";
import { Text } from "@components/Text";
import { useCopyToClipboard } from "@hooks/useCopyToClipboard";
import { ReactNode } from "react";
import { Button as AriaButton } from "react-aria-components/Button";
import { useTranslation } from "react-i18next";

interface DebugInfoSectionProps {
  title: string;
  copyText: string;
  children: ReactNode;
}

export function DebugInfoSection({
  title,
  copyText,
  children
}: DebugInfoSectionProps) {
  const { t } = useTranslation();
  const { copyToClipboard } = useCopyToClipboard();

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <Text variant="sm" weight="medium" color="glyph-primary">
          {title}
        </Text>
        <AriaButton
          aria-label={t("buttonTooltips.copy_section.label")}
          onPress={() => copyToClipboard(copyText, false)}
          className="size-4 text-glyph-secondary data-[hovered]:text-glyph-primary outline-hidden"
        >
          <Icon iconSet="16" iconName="copy" />
        </AriaButton>
      </div>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}
