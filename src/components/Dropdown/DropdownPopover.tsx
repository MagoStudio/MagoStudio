import { Badge } from "@components/Badge";
import { Icon } from "@components/Icon";
import { Text } from "@components/Text";
import { cn } from "@utils";
import { useCallback, useState } from "react";
import { ListBox, ListBoxItem } from "react-aria-components/ListBox";
import { Popover } from "react-aria-components/Popover";
import { SelectionIndicator } from "react-aria-components/SelectionIndicator";

import type { DropdownItem } from "./types";

export type DropdownPopoverWidth = "trigger" | "content";

interface DropdownPopoverProps<T extends DropdownItem> {
  items: Iterable<T>;
  popoverWidth?: DropdownPopoverWidth;
}

export const DropdownPopover = <T extends DropdownItem>({
  items,
  popoverWidth = "trigger"
}: DropdownPopoverProps<T>) => {
  const [isScrollable, setIsScrollable] = useState(false);

  const listBoxRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      setIsScrollable(node.scrollHeight > node.clientHeight);
    }
  }, []);

  return (
    <Popover
      offset={10}
      className={popoverWidth === "content" ? "w-max" : undefined}
      style={
        popoverWidth === "content"
          ? { minWidth: "var(--trigger-width)" }
          : { width: "var(--trigger-width)" }
      }
    >
      {isScrollable && (
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-8 z-10 rounded-t bg-gradient-to-b from-element-tertiary to-transparent" />
      )}
      <ListBox
        ref={listBoxRef}
        className="bg-element-tertiary flex flex-col gap-0.5 p-2 rounded overflow-y-auto max-h-[inherit] scrollbar-custom"
        shouldFocusWrap
        items={items}
      >
        {({ label, key, badge }) => (
          <ListBoxItem
            key={key}
            textValue={label}
            className="outline-hidden p-0 m-0 min-h-8 rounded"
          >
            {({ isSelected, isFocused, isHovered }) => (
              <div
                className={cn(
                  "flex items-center min-h-8 rounded",
                  (isSelected || isFocused || isHovered) && "bg-element-primary"
                )}
              >
                <div className="w-8 flex items-center justify-center">
                  <SelectionIndicator>
                    <Icon
                      iconSet="16"
                      iconName="checkmark"
                      className="text-glyph-secondary"
                    />
                  </SelectionIndicator>
                </div>
                <div className="overflow-hidden pr-2 py-1 line-clamp-2">
                  <Text color="glyph-primary" variant="sm">
                    {label}
                  </Text>
                </div>
                {badge && (
                  <Badge
                    glyphColor="glyph-secondary"
                    className="ml-auto mr-2 bg-element-primary"
                  >
                    {badge}
                  </Badge>
                )}
              </div>
            )}
          </ListBoxItem>
        )}
      </ListBox>
      {isScrollable && (
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 z-10 rounded-b bg-gradient-to-t from-element-tertiary to-transparent" />
      )}
    </Popover>
  );
};
