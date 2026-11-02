import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { Tooltip } from "@components/Tooltip";
import { useTranslation } from "react-i18next";

type Props = {
  isDisabled: boolean;
  onPress: () => void;
  testId: string;
};

export const ShotInsertButton: React.FC<Props> = ({
  isDisabled,
  onPress,
  testId
}) => {
  const { t } = useTranslation();

  return (
    <Tooltip
      placement="top"
      isDismissedOnPress
      textContent={t("script_project.shot_insert_button.tooltip")}
      trigger={
        <IconActionButton
          variant="dark"
          size="sm"
          icon={<Icon iconSet="16" iconName="plus" />}
          aria-label={t("script_project.shot_insert_button.ariaLabel")}
          isDisabled={isDisabled}
          onPress={onPress}
          data-testid={testId}
        />
      }
    />
  );
};
