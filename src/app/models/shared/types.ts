import { SourceImage } from "@domains/renders/types";
import { AvailableUiComponentKey } from "@models/shared/availableUiComponents";

type SettingType = "string" | "number" | "boolean" | "enum" | "tool" | "array";

export type TooltipImage = { src: string; caption: string };

interface BaseSetting {
  key: string;
  secondKey?: string;
  type: SettingType;
  label: string;
  tooltip?: string;
  tooltipImage?: string;
  tooltipFormat?: "markdown";
  tooltipImages?: TooltipImage[];
  labelCaption?: string;
  ui: AvailableUiComponentKey;
  nullable?: boolean;
  defaultValue?: any;
  secondDefaultValue?: any;
  formatValueForBackend?: (value: any, secondValue?: any) => any;
  formatValueForFrontend?: (value: any, secondValue?: any) => any;
  hidingCondition?: (
    settings: Record<string, any>,
    isTeamMember?: boolean
  ) => boolean;
  specificConfig?: Record<string, any>;
  customValidation?: (
    value: unknown,
    allValues: Record<string, unknown>,
    sources?: SourceImage[]
  ) => string | undefined | null;
  errorMessage?: string;
}

interface NumberSetting extends BaseSetting {
  type: "number";
  min?: number;
  max?: number;
  step?: number;
}

interface ToolSetting extends BaseSetting {
  type: "tool";
}

interface StringSetting extends BaseSetting {
  type: "string";
}

interface BooleanSetting extends BaseSetting {
  type: "boolean";
}

interface EnumSetting extends BaseSetting {
  type: "enum";
  options: { value: string; label: string; badge?: string }[];
}

interface ArraySetting extends BaseSetting {
  type: "array";
}

export type Setting =
  | NumberSetting
  | StringSetting
  | BooleanSetting
  | EnumSetting
  | ToolSetting
  | ArraySetting;

export interface SettingsSection {
  name: string | undefined;
  tooltip?: string;
  settings: Setting[];
  settingsPerRow?: 2;
  hidingCondition?: (
    settings: Record<string, any>,
    isTeamMember: boolean
  ) => boolean;
  isControlNetDetailSetting?: boolean;
  isNamedCollapsible?: boolean;
  hasSeparatorAbove?: boolean;
}

export type SettingsLevel = "main" | "technical" | "quality" | "advanced";

export interface SettingsGroup {
  name: string;
  sections: SettingsSection[];
  level: SettingsLevel;
  hidingCondition?: (
    settings: Record<string, any>,
    isTeamMember: boolean
  ) => boolean;
}
