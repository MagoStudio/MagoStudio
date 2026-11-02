import { dropdownTriggerClassName } from "@components/Dropdown/dropdownTriggerClassName";
import { Icon } from "@components/Icon";
import { Text } from "@components/Text";
import { cn } from "@utils";
import { Button } from "react-aria-components/Button";

type BulkRenderingShotSettingsRowIcon = "edit" | "visibility";

export interface BulkRenderingShotSettingsRowProps {
  label?: string;
  value: string;
  icon: BulkRenderingShotSettingsRowIcon;
  ariaLabel: string;
  isDisabled?: boolean;
  isOverridden?: boolean;
  isPanelOpen?: boolean;
  hasError?: boolean;
  onPress?: () => void;
  "data-testid"?: string;
}

const overriddenClassName = cn(
  "bg-glyph-warning/20! border border-glyph-warning",
  "data-[hovered]:[background-image:none]"
);

const errorClassName = cn(
  "bg-glyph-error/20! border border-glyph-error",
  "data-[hovered]:[background-image:none]"
);

export function BulkRenderingShotSettingsRow({
  label,
  value,
  icon,
  ariaLabel,
  isDisabled,
  isOverridden,
  isPanelOpen,
  hasError,
  onPress,
  "data-testid": dataTestId
}: BulkRenderingShotSettingsRowProps) {
  return (
    <Button
      data-testid={dataTestId}
      className={cn(
        dropdownTriggerClassName,
        "w-full min-w-0 gap-1.5 pl-2",
        isOverridden && overriddenClassName,
        hasError && errorClassName
      )}
      isDisabled={isDisabled}
      aria-expanded={isPanelOpen}
      aria-label={ariaLabel}
      onPress={onPress}
    >
      {label !== undefined && (
        <Text
          component="span"
          variant="sm"
          color="glyph-tertiary"
          select="none"
          className="shrink-0 whitespace-nowrap"
        >
          {label}
        </Text>
      )}
      <Text
        component="span"
        variant="sm"
        color="inherit"
        align="left"
        overflow="hidden"
        textOverflow="ellipsis"
        whiteSpace="nowrap"
        className="min-w-0 flex-1"
      >
        {value}
      </Text>
      <span aria-hidden="true" className="shrink-0 pr-2">
        <Icon iconSet="16" iconName={icon} />
      </span>
    </Button>
  );
}
