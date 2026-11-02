import { RadioControl } from "@components/RadioControl";
import { Text } from "@components/Text";
import { cn } from "@utils";
import { Radio, RadioGroup } from "react-aria-components";
import type { RadioRenderProps } from "react-aria-components";

export interface RadioPillOption<T extends string> {
  value: T;
  label: string;
  isDisabled?: boolean;
  disabledReason?: string;
}

interface RadioPillProps<T extends string> {
  options: RadioPillOption<T>[];
  value: T | null;
  onChange: (value: T | null) => void;
  onDisabledPress?: (value: T) => void;
  className?: string;
  "aria-label"?: string;
}

const pillShellClassName = ({
  isHovered,
  isPressed,
  isDisabled,
  isFocusVisible
}: RadioRenderProps) =>
  cn(
    "group flex h-8 items-center gap-2 rounded px-3 py-1.5 outline-hidden",
    isDisabled ? "cursor-default" : "cursor-pointer",
    isFocusVisible && "ring-1 ring-glyph-secondary ring-offset-1",
    !isDisabled && (isHovered || isPressed)
      ? "bg-element-primary-active"
      : "bg-element-primary"
  );

type LabelColor = "glyph-primary" | "glyph-secondary" | "glyph-disabled";

const labelColor = ({
  isSelected,
  isHovered,
  isPressed,
  isDisabled
}: RadioRenderProps): LabelColor => {
  if (isDisabled) return "glyph-disabled";
  if (isSelected) return isHovered ? "glyph-primary" : "glyph-secondary";
  if (isPressed) return "glyph-secondary";
  if (isHovered) return "glyph-primary";
  return "glyph-secondary";
};

export function RadioPill<T extends string>({
  options,
  value,
  onChange,
  onDisabledPress,
  className,
  ...rest
}: RadioPillProps<T>) {
  return (
    <RadioGroup
      {...rest}
      value={value}
      onChange={(nextValue) => onChange(nextValue as T)}
      orientation="horizontal"
      className={cn("flex gap-2", className)}
    >
      {options.map((option) => (
        <div
          key={option.value}
          className="relative"
          data-testid={`radio-pill-${option.value}`}
        >
          <Radio
            value={option.value}
            isDisabled={option.isDisabled}
            onPress={() => {
              if (value === option.value) onChange(null);
            }}
            className={pillShellClassName}
          >
            {(renderProps) => (
              <>
                <RadioControl {...renderProps} />
                <Text
                  component="span"
                  color={labelColor(renderProps)}
                  select="none"
                  className="flex-1 min-w-0 text-[13px] leading-5"
                >
                  {option.label}
                </Text>
              </>
            )}
          </Radio>
          {option.isDisabled && (
            <button
              type="button"
              aria-label={option.label}
              aria-disabled="true"
              title={option.disabledReason}
              className="absolute inset-0 cursor-default rounded outline-hidden focus-visible:ring-1 focus-visible:ring-glyph-secondary focus-visible:ring-offset-1"
              onClick={() => onDisabledPress?.(option.value)}
            />
          )}
        </div>
      ))}
    </RadioGroup>
  );
}
