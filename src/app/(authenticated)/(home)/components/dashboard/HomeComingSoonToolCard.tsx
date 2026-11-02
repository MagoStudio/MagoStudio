import { Tag } from "@components/Tag";
import { Text } from "@components/Text";
import { useTranslation } from "react-i18next";

type Props = {
  icon: React.ReactNode;
  label: string;
  description: string;
};

export const HomeComingSoonToolCard: React.FC<Props> = ({
  icon,
  label,
  description
}) => {
  const { t } = useTranslation();

  return (
    <div
      aria-disabled="true"
      className="flex h-full cursor-not-allowed flex-col gap-2 rounded-3xl bg-surface-bg-100 p-6 text-glyph-primary backdrop-blur-xl"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="opacity-60">{icon}</div>
        <Tag>{t("upcoming_tools.coming_soon.label")}</Tag>
      </div>
      <div className="flex flex-col gap-2 opacity-60">
        <Text component="h3" variant="lg" weight="semibold" lineHeight="snug">
          {label}
        </Text>
        <Text variant="sm" color="glyph-secondary" lineHeight="relaxed">
          {description}
        </Text>
      </div>
    </div>
  );
};
