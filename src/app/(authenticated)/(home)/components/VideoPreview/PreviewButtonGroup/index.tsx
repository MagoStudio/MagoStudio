import { ButtonGroup } from "@components/ButtonGroup";
import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { Text } from "@components/Text";
import { Tooltip } from "@components/Tooltip";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { getDefaultCropSelection } from "@domains/renders/utils/cropRect";
import { isCropCapableEngine } from "@domains/renders/utils/isCropCapableEngine";
import { useSelectedTrackIds } from "@domains/track/useSelectedTrackIds";
import { useSetSelectedTrackIds } from "@domains/track/useSetSelectedTrackIds";
import { usePreviewHasAudioTrack } from "@home/components/VideoPreview/hooks/usePreviewHasAudioTrack";
import { useViewportZoomControls } from "@home/components/VideoPreview/hooks/useViewportZoomControls";
import { trackingWithProjectId } from "@hooks/tracking/trackingUtils";
import {
  useIsSettingsEditorOpenAtom,
  viewModeAtom,
  PreviewMode,
  isViewportFullscreenOpenAtom,
  isPreviewMutedAtom
} from "@store/atoms";
import { useShotCrop } from "@store/cropStore";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Button } from "react-aria-components/Button";
import { useTranslation } from "react-i18next";

const MAX_TRACKS_FOR_TWO_MODE = 2;

const Divider = () => (
  <span aria-hidden="true" className="h-6 w-px shrink-0 bg-glyph-invert-main" />
);

interface ViewportToolbarProps {
  showFullscreenToggle?: boolean;
}

export function ViewportToolbar({
  showFullscreenToggle = true
}: ViewportToolbarProps = {}) {
  const { t } = useTranslation();
  const selectedProjectId = useSelectedProjectId();
  const [isViewportFullscreenOpen, setIsViewportFullscreenOpen] = useAtom(
    isViewportFullscreenOpenAtom
  );
  const [viewMode, setViewMode] = useAtom(viewModeAtom);
  const [isMuted, setIsMuted] = useAtom(isPreviewMutedAtom);
  const { hasAudioTrack } = usePreviewHasAudioTrack();
  const selectedTrackIds = useSelectedTrackIds();
  const setSelectedTrackIds = useSetSelectedTrackIds();
  const setIsTrackSettingsDrawerOpen = useSetAtom(
    useIsSettingsEditorOpenAtom()
  );

  const { canZoomIn, canZoomOut, zoomIn, zoomOut, resetZoom, zoomPct } =
    useViewportZoomControls();

  const { selectedModelAtom } = useRenderSettingsAtoms();
  const selectedModel = useAtomValue(selectedModelAtom);
  const isCropCapableModel = isCropCapableEngine(selectedModel.name);

  const { isCropToolActive, setCrop, clearCrop } = useShotCrop();

  const isSingleTrackSelected = selectedTrackIds.length === 1;

  const handleViewModeChange = (mode: PreviewMode) => {
    if (isCropToolActive) return;

    if (isSingleTrackSelected && mode !== PreviewMode.SINGLE) {
      setIsTrackSettingsDrawerOpen(false);
    }

    if (mode === PreviewMode.SINGLE && selectedTrackIds.length > 1) {
      const firstSelectedTrackId = selectedTrackIds[0];
      setSelectedTrackIds([firstSelectedTrackId]);
    } else if (
      (mode === PreviewMode.SBS || mode === PreviewMode.TWO) &&
      selectedTrackIds.length > MAX_TRACKS_FOR_TWO_MODE
    ) {
      const firstTwoSelectedTrackIds = selectedTrackIds.slice(
        0,
        MAX_TRACKS_FOR_TWO_MODE
      );
      setSelectedTrackIds(firstTwoSelectedTrackIds);
    }

    setViewMode(mode);
    resetZoom();
    if (selectedProjectId) {
      trackingWithProjectId.viewportActions.sideBySideModeSwitch(
        selectedProjectId,
        mode
      );
    }
  };

  const isMultiTrackSelected = selectedTrackIds.length > 1;

  const soundToggleLabel = !hasAudioTrack
    ? t("actions.no_sound_on_track.label")
    : t(isMuted ? "actions.unmute_sound.label" : "actions.mute_sound.label");

  const soundToggleIconName = !hasAudioTrack
    ? "no-sound"
    : isMuted
      ? "volume-off"
      : "volume-up";

  const handleCropToggle = () => {
    if (isMultiTrackSelected) return;

    if (isCropToolActive) {
      clearCrop();
    } else {
      setCrop(getDefaultCropSelection());
    }
  };

  return (
    <div className="w-full bg-surface-secondary-opacity-90 backdrop-blur-md">
      <div className="flex justify-between items-center h-12 px-2">
        <div className="flex items-center gap-2">
          <ButtonGroup background="transparent" className="gap-0.5 p-0">
            <Tooltip textContent={t("buttonTooltips.preview_button_one.label")}>
              <IconActionButton
                aria-label="Selection of single preview"
                aria-pressed={viewMode === PreviewMode.SINGLE}
                size="xs"
                icon={<Icon iconSet="16-filled" iconName="one-sbs" />}
                isDisabled={isCropToolActive}
                className={
                  viewMode === PreviewMode.SINGLE
                    ? "text-glyph-primary"
                    : undefined
                }
                onPress={() => handleViewModeChange(PreviewMode.SINGLE)}
              />
            </Tooltip>

            <Tooltip
              textContent={t("buttonTooltips.preview_button_split.label")}
            >
              <IconActionButton
                aria-label="Split"
                aria-pressed={viewMode === PreviewMode.SBS}
                size="xs"
                icon={<Icon iconSet="16-filled" iconName="one-on-another" />}
                isDisabled={isCropToolActive}
                className={
                  viewMode === PreviewMode.SBS
                    ? "text-glyph-primary"
                    : undefined
                }
                onPress={() => handleViewModeChange(PreviewMode.SBS)}
              />
            </Tooltip>

            <Tooltip
              placement="bottom"
              textContent={t("buttonTooltips.preview_button_compare.label")}
            >
              <IconActionButton
                aria-label="Selection of two previews"
                aria-pressed={viewMode === PreviewMode.TWO}
                size="xs"
                icon={<Icon iconSet="16-filled" iconName="two-sbs" />}
                isDisabled={isCropToolActive}
                className={
                  viewMode === PreviewMode.TWO
                    ? "text-glyph-primary"
                    : undefined
                }
                onPress={() => handleViewModeChange(PreviewMode.TWO)}
              />
            </Tooltip>
          </ButtonGroup>

          {isCropCapableModel && (
            <>
              <Divider />

              <Tooltip
                placement="bottom"
                textContent={t("buttonTooltips.crop_toggle_button.label")}
              >
                <IconActionButton
                  aria-label={t("actions.toggle_crop.label")}
                  aria-pressed={isCropToolActive}
                  size="xs"
                  icon={<Icon iconSet="16" iconName="crop" />}
                  variant={isCropToolActive ? "primary" : "transparent"}
                  isDisabled={isMultiTrackSelected}
                  onPress={handleCropToggle}
                />
              </Tooltip>
            </>
          )}

          <Divider />

          <Tooltip placement="bottom" textContent={soundToggleLabel}>
            <IconActionButton
              aria-label={soundToggleLabel}
              aria-pressed={!hasAudioTrack ? undefined : isMuted}
              size="xs"
              icon={<Icon iconSet="16" iconName={soundToggleIconName} />}
              isDisabled={!hasAudioTrack}
              onPress={() => setIsMuted((prev) => !prev)}
            />
          </Tooltip>
        </div>

        <div className="flex items-center gap-2">
          <Divider />
          <ButtonGroup
            background="transparent"
            className="gap-0 p-0 items-center"
          >
            <Tooltip
              textContent={t("actions.zoom_out.label")}
              placement="bottom"
            >
              <IconActionButton
                aria-label={t("actions.zoom_out.label")}
                size="xs"
                icon={<Icon iconSet="16" iconName="zoom-out" />}
                onPress={zoomOut}
                isDisabled={!canZoomOut}
              />
            </Tooltip>

            <Tooltip
              textContent={t("buttonTooltips.zoom_reset_button.label")}
              placement="bottom"
            >
              <Button
                type="button"
                onPress={resetZoom}
                aria-label={t("actions.reset_zoom.label")}
                className="outline-hidden focus-visible:ring-1 focus-visible:ring-glyph-secondary focus-visible:ring-offset-1 rounded px-0.5 py-1.5"
              >
                <Text
                  component="span"
                  color="glyph-secondary"
                  variant="sm"
                  weight="bold"
                  className="text-center flex items-center justify-center select-none w-[34px]"
                >
                  {zoomPct}%
                </Text>
              </Button>
            </Tooltip>

            <Tooltip
              textContent={t("actions.zoom_in.label")}
              placement="bottom"
            >
              <IconActionButton
                aria-label={t("actions.zoom_in.label")}
                size="xs"
                icon={<Icon iconSet="16" iconName="zoom-in" />}
                onPress={zoomIn}
                isDisabled={!canZoomIn}
              />
            </Tooltip>
          </ButtonGroup>

          {showFullscreenToggle && (
            <Tooltip
              placement="bottom"
              textContent={t("buttonTooltips.fullscreen_viewport_button.label")}
            >
              <IconActionButton
                aria-label={t("actions.toggle_fullscreen.label")}
                aria-pressed={isViewportFullscreenOpen}
                size="xs"
                icon={
                  <Icon
                    iconSet="16"
                    iconName={
                      isViewportFullscreenOpen ? "fullscreen-off" : "fullscreen"
                    }
                  />
                }
                onPress={() =>
                  setIsViewportFullscreenOpen((prev: boolean) => !prev)
                }
              />
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}
