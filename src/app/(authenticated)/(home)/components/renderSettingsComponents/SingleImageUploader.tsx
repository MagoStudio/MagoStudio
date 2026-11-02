import { ControlLabel } from "@components/ControlLabel";
import { FileDropZone } from "@components/FileDropZone";

import { RenderSettingComponentProps } from "./interface";

export const SingleImageUploader: React.FC<
  RenderSettingComponentProps<string | undefined>
> = ({ label, tooltip, value, setValue, specificConfig }) => {
  const valueArray = value ? [value] : [];
  const dropZoneText = specificConfig?.dropZoneText;
  const dropZoneHintText = specificConfig?.dropZoneHintText;

  const handleChange = (nextIds: string[]) => {
    setValue(nextIds[0]);
  };

  return (
    <div className="group flex flex-col gap-1">
      <ControlLabel
        label={label}
        labelColor="glyph-tertiary"
        tooltip={tooltip}
      />
      <FileDropZone
        value={valueArray}
        maxFileUpload={1}
        text={dropZoneText}
        hintText={dropZoneHintText}
        onChange={handleChange}
      />
    </div>
  );
};
