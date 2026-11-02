import { SourceImageType } from "@domains/renders/types";
import { Img2ImgSettings } from "@models/img2img/types";
import { TooltipImage } from "@models/shared/types";
import { VideoEngine, VideoSettings } from "@models/video/types";
import { Layer } from "@schemas/layer";

export interface RenderSettingComponentProps<T> {
  key: string;
  name: string;
  secondName?: string;
  secondValue?: T;
  label: string;
  ariaLabel: string;
  labelCaption: string;
  tooltip: string;
  tooltipImage?: string;
  tooltipFormat?: "markdown";
  tooltipImages?: TooltipImage[];
  value: T;
  defaultValue: T;
  max?: number;
  min?: number;
  step?: number;
  setValue: (value: T | undefined) => void;
  setSecondValue?: (value: T | undefined) => void;
  isDisabled?: boolean;
  selectedLayer?: Layer;
  options?: { value: T; label: string }[];
  allValues?: Img2ImgSettings | VideoSettings;
  labelSize?: "sm";
  specificConfig?: {
    sourceRoles?: SourceImageType[];
    isPrimarySourceSlot?: boolean;
    stylizeButtonLabel?: string;
    uploadButtonLabel?: string;
    uploadButtonSubtitle?: string;
    maxFileSizeBytes?: number;
    fileSizeErrorKey?: string;
    minDimension?: number;
    maxDimension?: number;
    errorKeyTooSmall?: string;
    errorKeyTooBig?: string;
    hideAutoPrompt?: boolean;
    doubleHeight?: boolean;
    checkboxLabel?: string;
    valueIfChecked?: number;
    maxImageSlots?: number;
    fillAllEmptySlots?: boolean;
    role?: SourceImageType;
    unit?: string;
    placeholder?: string;
    dropZoneText?: string;
    dropZoneHintText?: string;
    /** The engine whose reference-tag form Optimize prompt adapts into. */
    adaptEngine?: VideoEngine;
  };
  onValueChange?: (key: string, value: unknown) => void;
}
