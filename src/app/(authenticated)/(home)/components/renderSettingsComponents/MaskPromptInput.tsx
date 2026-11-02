import { ControlLabel } from "@components/ControlLabel";
import { Textarea } from "@components/Textarea";

import { RenderSettingComponentProps } from "./interface";

export const MaskPromptInput: React.FC<
  RenderSettingComponentProps<string | undefined>
> = ({ name, label, tooltip, value, setValue, isDisabled }) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
  };

  return (
    <div className="group flex w-full flex-col gap-2">
      <ControlLabel
        inputId={name}
        label={label}
        labelColor="glyph-tertiary"
        tooltip={tooltip}
      />
      <Textarea
        id={name}
        data-testid={name}
        className="h-14 min-h-14 !pr-6 !pt-2 !text-sm"
        disabled={isDisabled}
        onChange={handleChange}
        readOnly={isDisabled}
        resize="vertical"
        value={value ?? ""}
      />
    </div>
  );
};
