import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";

type Props = {
  className?: string;
  isDisabled?: boolean;
  onPress?: () => void;
  /** @deprecated Use onPress */
  onClick?: () => void;
};

export const CloseButton: React.FC<Props> = ({
  className,
  isDisabled,
  onPress,
  onClick
}) => (
  <IconActionButton
    aria-label="Close"
    icon={<Icon iconSet="24" iconName="close" />}
    size="sm"
    className={className}
    isDisabled={isDisabled}
    onPress={onPress ?? onClick}
  />
);
