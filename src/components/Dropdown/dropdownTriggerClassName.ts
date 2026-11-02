import { cn } from "@utils";

export const dropdownTriggerClassName = cn(
  "flex items-center h-8 rounded text-sm",
  "bg-element-primary text-glyph-secondary",
  "data-[hovered]:[background-image:linear-gradient(0deg,var(--color-element-for-hover),var(--color-element-for-hover))]",
  "data-[hovered]:text-glyph-primary",
  "data-[disabled]:text-glyph-disabled",
  "outline-hidden focus-visible:ring-1 focus-visible:ring-glyph-secondary",
  "aria-expanded:ring-1 aria-expanded:ring-glyph-action-main!"
);
