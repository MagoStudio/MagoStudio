import { ButtonGroup } from "@components/ButtonGroup";
import { cn } from "@utils";
import { forwardRef } from "react";
import { Button as AriaButton } from "react-aria-components/Button";
export interface SwitcherOption<T> {
  label: string;
  value: T;
}

export interface SwitcherProps<T> {
  options: SwitcherOption<T>[];
  onOptionClick: (option: SwitcherOption<T>) => void;
  isOptionSelected: (option: SwitcherOption<T>) => boolean;
  className?: string;
  containerClassName?: string;
  fullWidth?: boolean;
}

function SwitcherComponent<T>(
  {
    onOptionClick,
    options,
    isOptionSelected,
    className,
    containerClassName,
    fullWidth
  }: SwitcherProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  return (
    <div
      ref={ref}
      className={cn(
        "bg-surface-on-image rounded-lg p-1 border border-element-tertiary",
        fullWidth ? "w-full" : "w-fit",
        containerClassName
      )}
    >
      <ButtonGroup
        background="transparent"
        disablePadding="all"
        className={cn("gap-1", fullWidth && "w-full")}
      >
        {options.map((option, index) => (
          <AriaButton
            className={cn(
              "h-6 min-w-[42px] py-0.5 px-1.5 rounded text-glyph-secondary text-[13px] leading-5 border-none whitespace-nowrap outline-none focus-visible:outline-none",
              fullWidth && "flex-1",
              isOptionSelected(option) && "bg-element-tertiary",
              className
            )}
            onPress={() => onOptionClick(option)}
            key={`${option.label}-${index}`}
          >
            {option.label}
          </AriaButton>
        ))}
      </ButtonGroup>
    </div>
  );
}

export const Switcher = forwardRef(SwitcherComponent) as <T>(
  props: SwitcherProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> }
) => ReturnType<typeof SwitcherComponent>;
