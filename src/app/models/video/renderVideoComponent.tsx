import { Popover } from "@components/Popover";
import { RenderSettingComponentProps } from "@home/components/renderSettingsComponents/interface";
import { VideoSettings } from "@models/video/types";
import { Layer } from "@schemas/layer";
import { useRef, useState } from "react";

import { availableUiComponents } from "../shared/availableUiComponents";
import { Setting } from "../shared/types";

import { formatSettingInfo } from "./formatSettingInfo";

interface VideoComponentWrapperProps<T extends Setting["defaultValue"]> {
  setting: Setting;
  value: T;
  setValue: (value: T | undefined) => void;
  secondValue?: T;
  setSecondValue?: (value: T | undefined) => void;
  isDisabled?: boolean;
  selectedTrack?: Layer;
  options?: RenderSettingComponentProps<T>["options"];
  allValues?: VideoSettings;
  isTeamMember?: boolean;
  onValueChange?: (key: string, value: unknown) => void;
}

export const VideoComponentWrapper = <T extends Setting["defaultValue"]>({
  setting,
  value,
  setValue,
  secondValue,
  setSecondValue,
  isDisabled,
  selectedTrack,
  options,
  allValues,
  isTeamMember,
  onValueChange
}: VideoComponentWrapperProps<T>) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const labelRef = useRef<HTMLSpanElement>(null);

  const Component = availableUiComponents[setting.ui] as unknown as React.FC<
    RenderSettingComponentProps<T>
  >;

  if (!Component) {
    throw new Error(`Component ${setting.ui} not found`);
  }

  const min = "min" in setting ? setting.min : undefined;
  const max = "max" in setting ? setting.max : undefined;
  const step = "step" in setting ? setting.step : undefined;

  const labelElement = isTeamMember ? (
    <>
      <span
        ref={labelRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsPopoverOpen(!isPopoverOpen);
        }}
        style={{ cursor: "pointer" }}
      >
        {setting.label}
      </span>
      <Popover
        triggerRef={labelRef}
        isOpen={isPopoverOpen}
        onOpenChange={setIsPopoverOpen}
        placement="top"
      >
        {formatSettingInfo(setting, value, secondValue)}
      </Popover>
    </>
  ) : (
    setting.label
  );

  return (
    <Component
      key={setting.key}
      name={setting.key}
      label={labelElement as string}
      ariaLabel={setting.label}
      labelCaption={setting.labelCaption || ""}
      tooltip={setting.tooltip || ""}
      tooltipImage={setting.tooltipImage || undefined}
      tooltipFormat={setting.tooltipFormat}
      tooltipImages={setting.tooltipImages}
      value={value}
      secondName={setting.secondKey}
      secondValue={secondValue}
      setSecondValue={setSecondValue}
      setValue={setValue}
      isDisabled={isDisabled}
      defaultValue={setting.defaultValue as T}
      min={min}
      max={max}
      step={step}
      selectedLayer={selectedTrack}
      options={options}
      allValues={allValues}
      specificConfig={setting.specificConfig}
      onValueChange={onValueChange}
    />
  );
};
