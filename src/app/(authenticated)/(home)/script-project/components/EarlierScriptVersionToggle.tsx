import { Checkbox } from "@components/Checkbox";
import { useTranslation } from "react-i18next";

type Props = {
  hiddenCount: number;
  areHiddenItemsShown: boolean;
  onToggle: () => void;
  inputId: string;
  testId: string;
};

export const EarlierScriptVersionToggle: React.FC<Props> = ({
  hiddenCount,
  areHiddenItemsShown,
  onToggle,
  inputId,
  testId
}) => {
  const { t } = useTranslation();

  if (hiddenCount === 0) return null;

  return (
    <div className="w-fit" data-testid={testId}>
      <Checkbox
        inputId={inputId}
        isChecked={areHiddenItemsShown}
        onChange={onToggle}
        label={t("script_project.show_earlier_version_items.label", {
          count: hiddenCount
        })}
      />
    </div>
  );
};
