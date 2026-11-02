import { Text } from "@components/Text";
import React from "react";
import { useTranslation } from "react-i18next";

import { PresetCard, PRESETS } from "./PresetCard";

export const Img2ImgEmptyState: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 scrollbar-custom">
      <div className="flex flex-col items-center justify-center gap-3 rounded-sm bg-element-primary-active py-14">
        <img
          alt="Cat"
          className="h-[120px] w-[120px] object-contain select-none"
          src="/cat.gif"
        />
        <Text align="center" color="glyph-secondary" variant="sm">
          {t("titles.img2img_empty_state.no_modified_frames_yet")}
        </Text>
      </div>
      <div className="flex w-full flex-col gap-4">
        <Text variant="lg" color="glyph-primary">
          {t("titles.img2img_empty_state.guidance")}
        </Text>
        <div className="grid grid-cols-2 gap-6">
          {PRESETS.map((preset) => (
            <PresetCard key={preset.titleKey} preset={preset} />
          ))}
        </div>
      </div>
    </div>
  );
};
