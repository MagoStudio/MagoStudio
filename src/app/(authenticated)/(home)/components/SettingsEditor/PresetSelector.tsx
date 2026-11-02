"use client";

import { Icon } from "@components/Icon";
import { Text } from "@components/Text";
import { trackingUtils } from "@hooks/tracking/trackingUtils";
import { MAGO_PRESETS, MagoPreset } from "@models/preset";
import { VideoEngine } from "@models/video/types";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { useAtomValue, useSetAtom } from "jotai";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { PresetModal } from "./PresetModal";

export const PresetSelector: React.FC = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { selectedPresetAtom, applyPresetAtom } = useRenderSettingsAtoms();
  const selectedPresetState = useAtomValue(selectedPresetAtom);
  const applyPreset = useSetAtom(applyPresetAtom);

  const selectedPreset = selectedPresetState
    ? MAGO_PRESETS.find((p) => p.id === selectedPresetState.presetId)
    : null;

  const handleSelectPreset = (preset: MagoPreset) => {
    trackingUtils.presetActions.select(preset.displayName);
    applyPreset({
      presetId: preset.id,
      modelName: preset.model as VideoEngine,
      settingsOverrides: preset.settingsOverrides
    });
    setIsModalOpen(false);
  };

  const presetDisplayText = selectedPreset
    ? selectedPreset.displayName
    : t("renderSettings.select_placeholder.label");

  return (
    <>
      <button
        type="button"
        data-onboarding-id="pf-preset-selector"
        onClick={() => setIsModalOpen(true)}
        aria-label={t("renderSettings.preset.label")}
        className="flex w-full min-w-0 items-center gap-1.5 h-8 pl-2 pr-2 rounded-[4px] bg-element-primary text-glyph-secondary hover:text-glyph-primary hover:[background-image:linear-gradient(0deg,var(--color-element-for-hover),var(--color-element-for-hover))] outline-hidden focus-visible:ring-1 focus-visible:ring-glyph-secondary"
      >
        <Text
          component="span"
          variant="sm"
          color="glyph-tertiary"
          select="none"
          className="shrink-0 whitespace-nowrap"
        >
          {t("renderSettings.preset.label")}
        </Text>
        <Text
          component="span"
          variant="sm"
          color="inherit"
          className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left"
        >
          {presetDisplayText}
        </Text>
        <span aria-hidden="true" className="shrink-0">
          <Icon iconSet="16" iconName="chevron-down" className="text-current" />
        </span>
      </button>

      <PresetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectPreset={handleSelectPreset}
      />
    </>
  );
};
