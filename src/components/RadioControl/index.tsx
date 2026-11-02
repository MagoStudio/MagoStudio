import { cn } from "@utils";
import type { RadioRenderProps } from "react-aria-components";

type RadioControlState = Pick<
  RadioRenderProps,
  "isSelected" | "isHovered" | "isPressed" | "isDisabled"
>;

export const RadioControl = ({
  isSelected,
  isHovered,
  isPressed,
  isDisabled
}: RadioControlState) => (
  <span
    className={cn(
      "relative flex size-[1.125rem] shrink-0 items-center justify-center rounded-full border transition-colors",
      isDisabled
        ? isSelected
          ? "border-transparent bg-glyph-tertiary"
          : "border-glyph-disabled bg-transparent"
        : isSelected
          ? isHovered
            ? "border-element-tertiary-active bg-element-tertiary-active"
            : "border-transparent bg-element-tertiary-active"
          : isHovered || isPressed
            ? "border-glyph-action-main bg-element-primary-active"
            : "border-glyph-tertiary bg-transparent"
    )}
  >
    {isSelected && (
      <span
        className={cn(
          "size-1.5 rounded-full",
          isDisabled ? "bg-glyph-invert-main" : "bg-element-primary-on-pic"
        )}
      />
    )}
  </span>
);
