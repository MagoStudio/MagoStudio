import { CircularProgress } from "@components/CircularProgress";
import { Text } from "@components/Text";
import { useTranslation } from "react-i18next";

type Props = {
  testId?: string;
};

export const RenderingBadge: React.FC<Props> = ({ testId }) => {
  const { t } = useTranslation();

  return (
    <span
      className="flex items-center gap-1.5 rounded-full bg-surface-primary px-2 py-0.5"
      data-testid={testId}
    >
      <CircularProgress size="sm" color="glyph-secondary" />
      <Text component="span" variant="2xs" color="glyph-secondary">
        {t("script_project.version_not_ready.label")}
      </Text>
    </span>
  );
};
