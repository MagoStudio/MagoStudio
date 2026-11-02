import React from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { ControlLabel } from "../../ControlLabel";
import { FileDropZone, FileDropZoneProps } from "../../FileDropZone";
import { InfoTooltipIcon } from "../../InfoTooltipIcon";
import { Text } from "../../Text";

type BaseFieldProps = {
  name: string;
  label?: string;
  tooltip?: string;
  tooltipImage?: string;
  description?: string;
  onChange?: (assetIds: string[]) => void;
};

interface FieldFileDropZoneProps extends BaseFieldProps, FileDropZoneProps {}

export function FieldFileDropZone(props: FieldFileDropZoneProps) {
  const {
    name,
    label,
    tooltip,
    tooltipImage,
    description,
    onChange: propsOnChange,
    ...rest
  } = props;
  const { setValue } = useFormContext();
  const value = useWatch({ name });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-0.5">
        {label && (
          <div className="flex items-center gap-1.5">
            <ControlLabel labelColor="glyph-tertiary" label={label} />
            {tooltip && (
              <InfoTooltipIcon
                tooltip={tooltip}
                tooltipImage={tooltipImage}
                labelColor="glyph-tertiary"
              />
            )}
          </div>
        )}
        {description && (
          <Text color="glyph-tertiary" variant="2xs">
            {description}
          </Text>
        )}
      </div>
      <FileDropZone
        onChange={(assetIds: string[]) => {
          setValue(name, assetIds, { shouldValidate: true });
          propsOnChange?.(assetIds);
        }}
        value={value}
        {...rest}
      />
    </div>
  );
}
