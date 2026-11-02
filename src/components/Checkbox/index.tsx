import { Icon } from "@components/Icon";
import { cn } from "@utils";
import { forwardRef } from "react";

type Props = {
  boxed?: boolean;
  disabled?: boolean;
  inputId?: string;
  isChecked?: boolean;
  label?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isPresentational?: boolean;
  hoverFillsBackground?: boolean;
};

export const Checkbox = forwardRef<HTMLInputElement, Props>(
  (
    {
      boxed,
      disabled,
      inputId,
      isChecked,
      label,
      onChange,
      isPresentational = false,
      hoverFillsBackground = true
    },
    ref
  ) => {
    return (
      <span
        className={cn(
          "relative flex gap-2",
          disabled && "text-glyph-disabled",
          boxed &&
            "flex-1 h-8 items-center px-3 rounded bg-element-primary w-full"
        )}
      >
        <span
          className={cn(
            "group relative overflow-hidden inline-flex items-center justify-center shrink-0 rounded text-glyph-primary focus:outline-hidden",
            isChecked &&
              !disabled &&
              !isPresentational &&
              "bg-element-tertiary-active border border-transparent hover:border-glyph-action-main active:border-glyph-action-main active:translate-y-0.5 data-[pressed]:border-glyph-action-main data-[pressed]:translate-y-0.5",
            isChecked &&
              !disabled &&
              isPresentational &&
              "bg-element-tertiary-active border border-transparent group-hover:border-glyph-action-main group-active:border-glyph-action-main group-active:translate-y-0.5 group-data-[hovered]:border-glyph-action-main group-data-[pressed]:border-glyph-action-main group-data-[pressed]:translate-y-0.5",
            isChecked &&
              disabled &&
              "bg-element-secondary border-0 pointer-events-none",
            !isChecked &&
              !disabled &&
              !isPresentational &&
              "bg-transparent border border-glyph-tertiary hover:border-glyph-action-main hover:bg-element-primary-active active:border-glyph-action-main active:bg-element-primary-active active:translate-y-0.5 data-[pressed]:border-glyph-action-main data-[pressed]:bg-element-primary-active data-[pressed]:translate-y-0.5",
            !isChecked &&
              !disabled &&
              isPresentational &&
              hoverFillsBackground &&
              "bg-transparent border border-glyph-tertiary group-hover:border-glyph-action-main group-hover:bg-element-primary-active group-active:border-glyph-action-main group-active:bg-element-primary-active group-active:translate-y-0.5 group-data-[hovered]:border-glyph-action-main group-data-[hovered]:bg-element-primary-active group-data-[pressed]:border-glyph-action-main group-data-[pressed]:bg-element-primary-active group-data-[pressed]:translate-y-0.5",
            !isChecked &&
              !disabled &&
              isPresentational &&
              !hoverFillsBackground &&
              "bg-transparent border border-glyph-tertiary group-hover:border-glyph-action-main group-active:border-glyph-action-main group-active:translate-y-0.5 group-data-[hovered]:border-glyph-action-main group-data-[pressed]:border-glyph-action-main group-data-[pressed]:translate-y-0.5",
            !isChecked &&
              disabled &&
              "bg-transparent border border-glyph-disabled pointer-events-none"
          )}
          style={{ width: "1.125rem", height: "1.125rem" }}
          tabIndex={isPresentational || disabled ? -1 : 0}
        >
          <span className="absolute top-0 left-0 bottom-0 right-0 z-10">
            <input
              id={inputId}
              checked={isChecked}
              disabled={disabled}
              className={cn(
                "appearance-none absolute m-0 opacity-0 w-full h-full",
                isPresentational && "pointer-events-none"
              )}
              onChange={onChange}
              readOnly={isPresentational && !onChange}
              aria-hidden={isPresentational || undefined}
              tabIndex={isPresentational ? -1 : undefined}
              ref={ref}
              type="checkbox"
            />
          </span>
          {!!isChecked && (
            <Icon
              iconSet="16"
              iconName="checkmark"
              className={cn(
                "inline-block select-none shrink-0 w-4 h-4 text-glyph-primary-on-pic",
                disabled && "text-glyph-invert-main"
              )}
            />
          )}
        </span>
        {label && (
          <label
            className={cn(
              "min-w-0 font-medium select-none text-sm text-glyph-secondary",
              disabled && "text-glyph-disabled-opacity-70 pointer-events-none"
            )}
            htmlFor={isPresentational ? undefined : inputId}
          >
            {label}
          </label>
        )}
      </span>
    );
  }
);

Checkbox.displayName = "Checkbox";
