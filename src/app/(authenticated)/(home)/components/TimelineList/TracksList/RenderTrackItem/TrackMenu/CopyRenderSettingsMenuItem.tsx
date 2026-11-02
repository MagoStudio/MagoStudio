import { MenuItem } from "@components/MenuItem";
import { MenuItemButton } from "@components/MenuItemButton";
import { MenuItemText } from "@components/MenuItemText";
import { getTrackRenderSettings } from "@domains/track/utils/getTrackRenderSettings";
import { useIsTeamMember } from "@hooks/userLocalStorage";
import { Layer } from "@schemas/layer";
import { useToast } from "@store/useToast";
import { useTranslation } from "react-i18next";

interface CopyRenderSettingsMenuItemProps {
  track: Layer;
  onClose: () => void;
}

export const CopyRenderSettingsMenuItem: React.FC<
  CopyRenderSettingsMenuItemProps
> = ({ track, onClose }) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const isTeamMember = useIsTeamMember();
  const renderSettings = getTrackRenderSettings(track);

  if (!isTeamMember || !renderSettings) {
    return null;
  }

  const handleCopy = async () => {
    onClose();
    await navigator.clipboard.writeText(
      JSON.stringify(renderSettings, null, 2)
    );
    showToast({
      message: t("notifications.copied_to_clipboard.description")
    });
  };

  return (
    <MenuItem>
      <MenuItemButton onClick={handleCopy}>
        <MenuItemText
          title={t("actions.copy_render_settings.label")}
          titleColor="glyph-secondary"
        />
      </MenuItemButton>
    </MenuItem>
  );
};
