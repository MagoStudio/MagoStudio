import { Setting } from "../shared/types";

export const formatSettingInfo = <T extends Setting["defaultValue"]>(
  setting: Setting,
  value: T,
  secondValue?: T
): string => {
  const lines: string[] = [];

  lines.push(`key: ${setting.key}`);
  lines.push(`value: ${JSON.stringify(value)}`);
  lines.push(`defaultValue: ${JSON.stringify(setting.defaultValue)}`);

  if (setting.secondKey) {
    lines.push(`secondKey: ${setting.secondKey}`);
    lines.push(`secondValue: ${JSON.stringify(secondValue)}`);
    lines.push(
      `secondDefaultValue: ${JSON.stringify(setting.secondDefaultValue)}`
    );
  }

  if ("min" in setting) lines.push(`min: ${setting.min}`);
  if ("max" in setting) lines.push(`max: ${setting.max}`);
  if ("step" in setting) lines.push(`step: ${setting.step}`);
  if ("options" in setting)
    lines.push(`options: ${JSON.stringify(setting.options)}`);
  if (setting.labelCaption) lines.push(`labelCaption: ${setting.labelCaption}`);
  if (setting.nullable) lines.push(`nullable: ${setting.nullable}`);
  if (setting.specificConfig)
    lines.push(`specificConfig: ${JSON.stringify(setting.specificConfig)}`);

  return lines.join("\n");
};
