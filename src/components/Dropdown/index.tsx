import { Icon } from "@components/Icon";
import { cn } from "@utils";
import React from "react";
import { Button } from "react-aria-components/Button";
import {
  Select as RASelect,
  SelectValue,
  SelectProps as RASelectProps
} from "react-aria-components/Select";

import { DropdownPopover, DropdownPopoverWidth } from "./DropdownPopover";
import { dropdownTriggerClassName } from "./dropdownTriggerClassName";
import type { DropdownItem, DropdownType } from "./types";

export type { DropdownItem, DropdownType };

export interface DropdownProps<
  T extends DropdownItem,
  M extends DropdownType
> extends Omit<RASelectProps<T, M>, "children"> {
  items: Iterable<T>;
  popoverWidth?: DropdownPopoverWidth;
}

function DropdownInternal<
  T extends DropdownItem,
  M extends DropdownType = "single"
>(
  { items, className, popoverWidth, ...rest }: DropdownProps<T, M>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  return (
    <RASelect
      ref={ref}
      className={cn("flex items-center gap-3", className)}
      {...rest}
    >
      <Button
        className={cn(
          dropdownTriggerClassName,
          "flex-1 min-w-0 justify-between pl-2"
        )}
      >
        <SelectValue className="overflow-hidden text-ellipsis whitespace-nowrap flex-1 text-left">
          {({ selectedText, defaultChildren }) =>
            selectedText || defaultChildren
          }
        </SelectValue>
        <span aria-hidden="true" className="ml-2.5 pr-2 flex-shrink-0">
          <Icon iconSet="16" iconName="chevron-down" />
        </span>
      </Button>
      <DropdownPopover items={items} popoverWidth={popoverWidth} />
    </RASelect>
  );
}

export const Dropdown = React.forwardRef(DropdownInternal) as <
  T extends DropdownItem,
  M extends DropdownType = "single"
>(
  props: DropdownProps<T, M> & { ref?: React.ForwardedRef<HTMLDivElement> }
) => React.ReactElement;
