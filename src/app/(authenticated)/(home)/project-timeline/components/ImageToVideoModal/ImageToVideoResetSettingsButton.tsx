import { GhostButton } from "@components/GhostButton";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { useSetAtom } from "jotai";
import { useTranslation } from "react-i18next";

export const ImageToVideoResetSettingsButton: React.FC = () => {
  const { t } = useTranslation();
  const { resetToDefaultsAtom } = useRenderSettingsAtoms();
  const resetToDefaults = useSetAtom(resetToDefaultsAtom);

  return (
    <div className="flex justify-end">
      <GhostButton onPress={resetToDefaults} type="button">
        {t("actions.reset_settings.label")}
      </GhostButton>
    </div>
  );
};
