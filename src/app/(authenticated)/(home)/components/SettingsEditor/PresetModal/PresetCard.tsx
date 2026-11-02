"use client";

import { Text } from "@components/Text";
import { MagoPreset } from "@models/preset";
import { Setting } from "@models/shared/types";
import { RENDER_MODELS } from "@models/video/constants";
import { VideoEngine } from "@models/video/types";
import { flattenSettingsGroups } from "@models/video/utils/flattenSettingsGroups";
import { Button } from "react-aria-components/Button";
import { useTranslation } from "react-i18next";

const getSettingValueLabel = (
  key: string,
  value: unknown,
  engineName: string
): string | null => {
  const model = RENDER_MODELS.find((m) => m.name === engineName);
  if (!model) return null;

  for (const section of flattenSettingsGroups(model)) {
    const setting = section.settings.find(
      (s: Setting) => s.key === key || s.secondKey === key
    );
    if (setting) {
      if (setting.type === "enum") {
        const option = setting.options.find((opt) => opt.value === value);
        return option?.label ?? null;
      }
      if (setting.type === "boolean" && value === true) {
        return setting.label;
      }
      return null;
    }
  }
  return null;
};

interface PresetCardProps {
  preset: MagoPreset;
  onClick: () => void;
}

export const PresetCard: React.FC<PresetCardProps> = ({ preset, onClick }) => {
  const { t } = useTranslation();
  const model = RENDER_MODELS.find((m) => m.name === preset.model);

  const overrideBadges = Object.entries(preset.settingsOverrides)
    .filter(([key, value]) => value !== undefined && key !== "keep_background")
    .map(([key, value]) => getSettingValueLabel(key, value, preset.model))
    .filter((label): label is string => label !== null);

  const backgroundTag =
    preset.model === VideoEngine.V4_0_0 || preset.model === VideoEngine.V4_1_0
      ? preset.settingsOverrides?.keep_background === true
        ? t("trackSettings.with_background.label")
        : t("trackSettings.chara_only.label")
      : null;

  if (!model) return null;

  return (
    <Button
      aria-label={preset.displayName}
      onClick={onClick}
      className="flex flex-col gap-2 items-start w-60 bg-surface-on-image rounded-[20px] transition-all border-2 border-transparent hover:border-element-additional-active text-left overflow-hidden p-3 pb-4"
    >
      <div className="flex w-full h-[6.5rem] overflow-hidden">
        <div className="flex-1 h-full overflow-hidden rounded-tl-[8px] rounded-bl-[8px]">
          <img
            src={preset.beforeImagePath}
            alt={`${preset.displayName} before`}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 h-full overflow-hidden rounded-tr-[8px] rounded-br-[8px]">
          <img
            src={preset.afterImagePath}
            alt={`${preset.displayName} after`}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <div className="flex flex-col justify-between flex-1 w-full">
        <div className="flex flex-col gap-0.5">
          <Text variant="sm" color="glyph-primary" weight="bold">
            {preset.displayName}
          </Text>
          <Text variant="2xs" color="glyph-tertiary" weight="normal">
            {preset.description}
          </Text>
        </div>

        <div className="flex flex-wrap gap-1 mt-2">
          <Text
            variant="sm"
            color="glyph-tertiary"
            weight="normal"
            className="inline-flex items-center justify-center px-2 py-0.5 bg-surface-on-image backdrop-blur-[10px] rounded"
          >
            {model.displayName}
          </Text>
          {backgroundTag && (
            <Text
              variant="sm"
              color="glyph-tertiary"
              weight="normal"
              className="inline-flex items-center justify-center px-1.5 py-0.5 bg-surface-on-image backdrop-blur-[10px] rounded"
            >
              {backgroundTag}
            </Text>
          )}
          {overrideBadges?.map((badge) => (
            <Text
              variant="sm"
              key={badge}
              color="glyph-tertiary"
              weight="normal"
              className="inline-flex items-center justify-center px-1.5 py-0.5 bg-surface-on-image backdrop-blur-[10px] rounded"
            >
              {badge}
            </Text>
          ))}
        </div>
      </div>
    </Button>
  );
};
