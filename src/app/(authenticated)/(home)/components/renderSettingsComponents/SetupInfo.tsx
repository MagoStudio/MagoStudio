import { InfoTooltipIcon } from "@components/InfoTooltipIcon";

import { RenderSettingComponentProps } from "./interface";

export const SetupInfo = ({
  label,
  tooltip,
  tooltipFormat
}: RenderSettingComponentProps<boolean>) => (
  <div className="flex items-center gap-1.5 text-sm text-glyph-secondary">
    <span>{label}</span>
    <InfoTooltipIcon
      tooltip={tooltip}
      tooltipFormat={tooltipFormat}
      labelColor="glyph-tertiary"
    />
  </div>
);
