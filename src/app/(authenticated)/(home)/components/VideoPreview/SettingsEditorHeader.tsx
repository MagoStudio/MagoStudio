import { DisclosureAnimatedIconButton } from "@components/DisclosureAnimatedIconButton";
import { Text } from "@components/Text";
import { useFilteredAndSortedTracks } from "@domains/track/useFilteredAndSortedTracks";
import { CopyPasteSettings } from "@home/components/SettingsEditor/Inputs/CopyPasteSettings";
import { trackingUtils } from "@hooks/tracking/trackingUtils";
import { useIsSettingsEditorOpenAtom } from "@store/atoms";
import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";

export const SettingsEditorHeader: React.FC = () => {
  const { t } = useTranslation();
  const [isSettingsEditorOpen, setIsSettingsEditorOpen] = useAtom(
    useIsSettingsEditorOpenAtom()
  );
  const {
    data: { videoTrack }
  } = useFilteredAndSortedTracks();

  const handleClick = () => {
    setIsSettingsEditorOpen(!isSettingsEditorOpen);
    trackingUtils.settingsActions.panelVisibility(
      isSettingsEditorOpen ? "close" : "open",
      videoTrack.id
    );
  };

  return (
    <div
      className={
        "relative flex items-center justify-between w-track-settings bg-surface-secondary-opacity-90 shrink-0 after:content-[''] after:absolute after:top-0 after:-right-px after:h-full after:w-px after:bg-glyph-invert-main after:z-1"
      }
      data-onboarding-id="pf-settings-editor-header"
    >
      <div className="flex items-center gap-4 flex-1 h-full px-3">
        <Text
          component="span"
          color="glyph-secondary"
          select="none"
          variant="sm"
        >
          {t("titles.render_settings.label")}
        </Text>
      </div>

      <div className={"flex items-center justify-end gap-3 mx-4"}>
        <CopyPasteSettings />
        <DisclosureAnimatedIconButton
          open={isSettingsEditorOpen}
          onPress={handleClick}
          aria-label={
            isSettingsEditorOpen
              ? "Close settings editor"
              : "Open settings editor"
          }
        />
      </div>
    </div>
  );
};
