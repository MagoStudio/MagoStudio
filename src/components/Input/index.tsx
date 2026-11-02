import { Text } from "@components/Text";
import { cn } from "@utils";
import { forwardRef, useState } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  endButton?: React.ReactNode;
  endCaption?: string;
  endIcon?: React.ReactNode;
  labelInside?: string;
  labelInsideEndAdornment?: React.ReactNode;
  preserveEmptyWhileFocused?: boolean;
  selectAllTextOnFocus?: boolean;
  severity?: "error";
  textAlign?: "left" | "center" | "right";
}

const severityClasses: Record<string, string> = {
  error: "text-glyph-error hover:text-glyph-error-hover"
};

const textAlignClasses: Record<string, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right"
};

const EndCaption = ({ disabled, endCaption }: InputProps) => (
  <Text
    align="right"
    color="glyph-tertiary"
    className="absolute right-2 ml-2"
    component="span"
    disabled={disabled}
    select="none"
    variant="sm"
  >
    {endCaption}
  </Text>
);

const EndIcon = ({ disabled, endIcon }: InputProps) => (
  <span
    className={cn(
      "absolute right-2 ml-2 h-[1rem] w-decorator-sm",
      disabled ? "text-glyph-disabled" : "text-glyph-tertiary"
    )}
  >
    {endIcon}
  </span>
);

const EndButton = ({ disabled, endButton }: InputProps) => (
  <span
    className={cn("absolute right-3 ml-2", disabled && "text-glyph-disabled")}
  >
    {endButton}
  </span>
);

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      disabled,
      endButton,
      endCaption,
      endIcon,
      labelInside,
      labelInsideEndAdornment,
      readOnly,
      textAlign = "left",
      type,
      severity,
      preserveEmptyWhileFocused = false,
      selectAllTextOnFocus,
      onBlur,
      onChange,
      onFocus,
      value,
      ...props
    },
    ref
  ) => {
    const [focusedValue, setFocusedValue] = useState<string | null>(null);
    const isUsingFocusedValue =
      preserveEmptyWhileFocused && type === "number" && focusedValue === "";

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      if (selectAllTextOnFocus) {
        e.target.select();
      }
      onFocus?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (preserveEmptyWhileFocused && type === "number") {
        setFocusedValue(e.target.value === "" ? "" : null);
      }
      onChange?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      onBlur?.(e);
      setFocusedValue(null);
    };

    const numberAppearanceClassName =
      type === "number"
        ? "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        : "appearance-none";

    if (labelInside !== undefined) {
      return (
        <div
          className={cn(
            "flex h-8 min-w-0 items-center gap-1.5 rounded border border-element-primary bg-element-primary py-1.5 pr-0.5 pl-2",
            "has-[input:hover]:border-glyph-action-main has-[input:focus-visible]:border-glyph-action-main",
            disabled &&
              "pointer-events-none select-none has-[input:hover]:border-element-primary",
            className
          )}
        >
          <Text
            component="span"
            variant="sm"
            color={disabled ? "glyph-disabled" : "glyph-tertiary"}
            select="none"
            className="shrink-0 whitespace-nowrap"
          >
            {labelInside}
          </Text>
          <input
            type={type}
            disabled={disabled}
            readOnly={readOnly}
            className={cn(
              numberAppearanceClassName,
              "min-w-0 flex-1 border-0 bg-transparent p-0 font-normal text-glyph-secondary text-sm",
              "focus-visible:text-glyph-primary focus-visible:outline-hidden",
              "hover:text-glyph-primary",
              disabled && "text-glyph-disabled placeholder:text-glyph-disabled",
              severity && severityClasses[severity],
              textAlignClasses[textAlign]
            )}
            ref={ref}
            value={isUsingFocusedValue ? focusedValue : value}
            onBlur={handleBlur}
            onChange={handleChange}
            onFocus={handleFocus}
            {...props}
          />
          {labelInsideEndAdornment}
        </div>
      );
    }

    return (
      <div className="relative flex items-center flex-nowrap grow shrink-0 min-w-[4.75rem] [&>div:first-of-type]:w-full">
        <input
          type={type}
          disabled={disabled}
          readOnly={readOnly}
          className={cn(
            numberAppearanceClassName,
            "relative flex items-center pl-2 py-1 h-8 min-w-0 w-full rounded border border-element-primary bg-element-primary font-normal text-glyph-secondary text-md",
            endButton ? "pr-10" : "pr-2.5",
            "focus-visible:outline-hidden focus-visible:border-glyph-action-main focus-visible:text-glyph-primary",
            "hover:border-glyph-action-main hover:text-glyph-primary",
            disabled &&
              "text-glyph-disabled bg-element-primary pointer-events-none select-none placeholder:text-glyph-disabled placeholder:select-none",
            disabled &&
              readOnly &&
              "hover:outline-glyph-disabled hover:border-glyph-disabled",
            severity && severityClasses[severity],
            textAlignClasses[textAlign],
            className
          )}
          ref={ref}
          value={isUsingFocusedValue ? focusedValue : value}
          onBlur={handleBlur}
          onChange={handleChange}
          onFocus={handleFocus}
          {...props}
        />
        {endCaption && (
          <EndCaption disabled={disabled} endCaption={endCaption} />
        )}
        {endIcon && <EndIcon disabled={disabled} endIcon={endIcon} />}
        {endButton && <EndButton disabled={disabled} endButton={endButton} />}
      </div>
    );
  }
);

Input.displayName = "Input";
