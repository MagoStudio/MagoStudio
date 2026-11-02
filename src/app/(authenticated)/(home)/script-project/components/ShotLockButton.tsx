import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { Tooltip } from "@components/Tooltip";
import { useTranslation } from "react-i18next";

type Props = {
  isShotLocked: boolean;
  isLockPending: boolean;
  onToggleLocked: () => void;
  testId: string;
};

export const ShotLockButton: React.FC<Props> = ({
  isShotLocked,
  isLockPending,
  onToggleLocked,
  testId
}) => {
  const { t } = useTranslation();

  return (
    <Tooltip
      placement="top"
      isDismissedOnPress
      textContent={t(
        isShotLocked
          ? "script_project.shot_lock_button.unlockTooltip"
          : "script_project.shot_lock_button.lockTooltip"
      )}
      trigger={
        <IconActionButton
          variant={isShotLocked ? "primary" : "dark"}
          className={isShotLocked ? "bg-element-success" : undefined}
          size="xs"
          icon={<Icon iconSet="16" iconName="lock" />}
          aria-pressed={isShotLocked}
          isDisabled={isLockPending}
          loading={isLockPending}
          aria-label={t("script_project.shot_lock_button.ariaLabel")}
          onPress={onToggleLocked}
          data-testid={testId}
        />
      }
    />
  );
};
