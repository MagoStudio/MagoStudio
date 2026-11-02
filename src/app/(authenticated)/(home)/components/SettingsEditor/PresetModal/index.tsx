"use client";

import { CloseButton } from "@components/CloseButton";
import { Text } from "@components/Text";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { useIsTeamMember } from "@hooks/userLocalStorage/useIsTeamMember";
import { MAGO_PRESETS, MagoPreset } from "@models/preset";
import { RENDER_MODELS } from "@models/video/constants";
import { useTranslation } from "react-i18next";

import { isVideoModelAvailable } from "@/platform/renderTarget";
import { useProviderPreferences } from "@/platform/useProviderPreferences";

import { PresetCard } from "./PresetCard";

interface PresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: MagoPreset) => void;
}

export const PresetModal: React.FC<PresetModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset
}) => {
  const { t } = useTranslation();
  const isTeamMember = useIsTeamMember();
  const providerPreferences = useProviderPreferences();

  const visiblePresets = MAGO_PRESETS.filter((preset) => {
    const model = RENDER_MODELS.find((m) => m.name === preset.model);
    if (!model) return false;
    if (model.status === "team_only" && !isTeamMember) return false;
    return isVideoModelAvailable(model.name, undefined, providerPreferences);
  });

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-surface-modal-backdrop" />
      <div className="fixed inset-0 flex items-center justify-center">
        <DialogPanel className="flex flex-col gap-5 relative p-5 rounded-[20px] shadow-[4px_20px_20px_5px_rgba(0,0,0,0.4)] bg-gradient-200 backdrop-blur-[50px]">
          <div className="flex justify-between">
            <div className="flex flex-col gap-2">
              <Text variant="lg" color="glyph-primary" weight="bold">
                {t("presets.modal.title.label")}
              </Text>
              <Text variant="md" color="glyph-secondary" weight="normal">
                {t("presets.modal.subtitle.label")}
              </Text>
            </div>
            <CloseButton onClick={onClose} />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {visiblePresets.map((preset) => (
              <PresetCard
                key={preset.id}
                preset={preset}
                onClick={() => onSelectPreset(preset)}
              />
            ))}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
