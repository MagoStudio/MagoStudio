import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { cn } from "@utils";

type Props = {
  open?: boolean;
  "aria-label"?: string;
  onPress?: () => void;
};

export const DisclosureAnimatedIconButton: React.FC<Props> = ({
  open,
  "aria-label": ariaLabel = "Disclosure button",
  onPress
}) => (
  <IconActionButton
    aria-label={ariaLabel}
    aria-pressed={Boolean(open)}
    onPress={onPress}
    icon={<Icon iconSet="16" iconName="chevron-down" />}
    className={cn(
      "transition-transform duration-[400ms] ease-[cubic-bezier(0.33,1,0.6,1)]",
      open && "-rotate-180"
    )}
  />
);
