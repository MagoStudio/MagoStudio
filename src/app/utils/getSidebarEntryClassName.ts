import { cn } from "@utils";

type SidebarEntryState = {
  isEntryActive: boolean;
  isEntryDisabled?: boolean;
};

export const getSidebarEntryClassName = ({
  isEntryActive,
  isEntryDisabled = false
}: SidebarEntryState): string =>
  cn(
    "flex w-full items-center gap-2 h-10 px-3 rounded-lg text-sm text-left text-glyph-secondary",
    !isEntryDisabled &&
      !isEntryActive &&
      "hover:text-glyph-primary hover:bg-element-primary-active",
    isEntryActive && "bg-element-primary-active text-glyph-primary",
    isEntryDisabled &&
      "text-glyph-disabled hover:text-glyph-disabled hover:bg-transparent cursor-not-allowed"
  );
