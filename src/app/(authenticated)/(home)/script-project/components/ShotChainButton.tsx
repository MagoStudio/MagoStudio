import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { Tooltip } from "@components/Tooltip";
import { useTranslation } from "react-i18next";

type Props = {
  isChainedToPreviousShot: boolean;
  onPress: () => void;
  testId: string;
};

export const ShotChainButton: React.FC<Props> = ({
  isChainedToPreviousShot,
  onPress,
  testId
}) => {
  const { t } = useTranslation();

  return (
    <Tooltip
      placement="top"
      isDismissedOnPress
      textContent={t(
        isChainedToPreviousShot
          ? "script_project.shot_chain_button.chainedTooltip"
          : "script_project.shot_chain_button.unchainedTooltip"
      )}
      trigger={
        <IconActionButton
          variant={isChainedToPreviousShot ? "primary" : "dark"}
          size="sm"
          icon={<Icon iconSet="16" iconName="chain-link" />}
          aria-pressed={isChainedToPreviousShot}
          aria-label={t("script_project.shot_chain_button.ariaLabel")}
          onPress={onPress}
          data-testid={testId}
        />
      }
    />
  );
};
