import { cn } from "@utils";

type MenuItemState = {
  isItemDisabled: boolean;
};

export const getMenuItemClassName = ({
  isItemDisabled
}: MenuItemState): string =>
  cn(
    "relative flex items-start justify-start flex-1 shrink-0 m-0 py-1 px-2 min-h-8 w-full border-0 rounded bg-transparent text-glyph-secondary font-medium text-left whitespace-nowrap select-none outline-0",
    "focus-visible:outline-offset-0 focus-visible:outline-4",
    !isItemDisabled &&
      "hover:bg-element-primary-active hover:no-underline active:bg-element-primary-active",
    isItemDisabled && "text-glyph-disabled hover:bg-transparent"
  );
