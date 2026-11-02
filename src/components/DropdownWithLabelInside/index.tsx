import { DropdownPopover } from "@components/Dropdown/DropdownPopover";
import { dropdownTriggerClassName } from "@components/Dropdown/dropdownTriggerClassName";
import type { DropdownItem, DropdownType } from "@components/Dropdown/types";
import { Icon } from "@components/Icon";
import { InfoTooltipIcon } from "@components/InfoTooltipIcon";
import { Text } from "@components/Text";
import { cn } from "@utils";
import React from "react";
import { Button } from "react-aria-components/Button";
import {
  Select as RASelect,
  SelectValue,
  SelectProps as RASelectProps
} from "react-aria-components/Select";

export interface DropdownWithLabelInsideProps<
  T extends DropdownItem,
  M extends DropdownType
> extends Omit<RASelectProps<T, M>, "children"> {
  label: string;
  tooltip?: string;
  items: Iterable<T>;
}

function DropdownWithLabelInsideInternal<
  T extends DropdownItem,
  M extends DropdownType = "single"
>(
  {
    items,
    className,
    label,
    tooltip,
    ...rest
  }: DropdownWithLabelInsideProps<T, M>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  return (
    <RASelect
      ref={ref}
      aria-label={label}
      className={cn("flex items-center", className)}
      {...rest}
    >
      <Button
        className={cn(dropdownTriggerClassName, "w-full min-w-0 gap-1.5 pl-2")}
      >
        <span className="flex shrink-0 items-center gap-1">
          <Text
            component="span"
            variant="sm"
            color="glyph-tertiary"
            select="none"
            className="whitespace-nowrap"
          >
            {label}
          </Text>
          {tooltip && (
            <InfoTooltipIcon tooltip={tooltip} labelColor="glyph-tertiary" />
          )}
        </span>
        <SelectValue className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-left">
          {({ selectedText, defaultChildren }) =>
            selectedText || defaultChildren
          }
        </SelectValue>
        <span aria-hidden="true" className="shrink-0 pr-2">
          <Icon iconSet="16" iconName="chevron-down" />
        </span>
      </Button>
      <DropdownPopover items={items} />
    </RASelect>
  );
}

export const DropdownWithLabelInside = React.forwardRef(
  DropdownWithLabelInsideInternal
) as <T extends DropdownItem, M extends DropdownType = "single">(
  props: DropdownWithLabelInsideProps<T, M> & {
    ref?: React.ForwardedRef<HTMLDivElement>;
  }
) => React.ReactElement;
