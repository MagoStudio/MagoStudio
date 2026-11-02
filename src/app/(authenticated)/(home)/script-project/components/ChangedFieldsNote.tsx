import { Text } from "@components/Text";
import {
  collapseReferenceChanges,
  describeChangedFields
} from "@domains/scriptProject/utils/describeChangedFields";
import { useTranslation } from "react-i18next";

type Props = {
  changedPaths: string[] | undefined;
  testId?: string;
};

export const ChangedFieldsNote: React.FC<Props> = ({
  changedPaths,
  testId
}) => {
  const { t } = useTranslation();

  const labels = describeChangedFields(
    collapseReferenceChanges(changedPaths)
  ).map(({ labelKey, rawPath }) => (labelKey ? t(labelKey) : rawPath));

  if (labels.length === 0) return null;

  return (
    <Text variant="xs" color="glyph-warning" data-testid={testId}>
      {t("script_project.will_rerender_because.label", {
        fields: labels.join(", ")
      })}
    </Text>
  );
};
