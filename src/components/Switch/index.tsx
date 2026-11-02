import { Text } from "@components/Text";
import { cn } from "@utils";
import { Switch as AriaSwitch } from "react-aria-components/Switch";
type Props = {
  ariaLabel?: string;
  className?: string;
  isDisabled?: boolean;
  isSelected?: boolean;
  label?: string;
  onChange?: (isSelected: boolean) => void;
};

export const Switch: React.FC<Props> = ({
  ariaLabel,
  className,
  isDisabled,
  isSelected,
  label,
  onChange
}) => {
  return (
    <AriaSwitch
      aria-label={ariaLabel || label}
      isSelected={isSelected}
      onChange={onChange}
      isDisabled={isDisabled}
      className={cn("group flex flex-row items-center", className)}
    >
      {label && (
        <Text
          className="flex-1 min-w-0 mr-1.5"
          color="glyph-secondary"
          component="span"
          select="none"
          variant="sm"
        >
          {label}
        </Text>
      )}
      <div
        className={cn(
          "relative inline-flex items-center self-center shrink-0 rounded-xl border border-solid border-glyph-disabled",
          "h-6 w-11 outline-hidden",
          "group-data-[selected]:bg-severity-success group-data-[selected]:border-severity-success",
          "group-data-[disabled]:pointer-events-none"
        )}
      >
        <span
          className={cn(
            "absolute inline-flex items-center justify-center top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all",
            "h-4 w-4 shadow-[1px_2px_3px_0px_rgba(30,64,21,0.56)]",
            "bg-glyph-disabled left-[calc(50%-10px)]",
            "group-data-[selected]:bg-glyph-primary-on-pic group-data-[selected]:left-[calc(50%+10px)]"
          )}
        />
      </div>
    </AriaSwitch>
  );
};
