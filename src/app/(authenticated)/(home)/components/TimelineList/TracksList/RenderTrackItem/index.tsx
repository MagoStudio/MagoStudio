import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { Tooltip } from "@components/Tooltip";
import { useProject } from "@domains/project/useProject";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { useUpdatePinnedTrackIds } from "@domains/project/useUpdatePinnedTrackIds";
import { useResolvedQueueStatus } from "@domains/queue/useResolvedQueueStatus";
import { parseSourcesForFrontend } from "@domains/renders/utils/parseRenderDataForFrontend";
import { reconstructLocalVideoReferenceSources } from "@domains/renders/utils/reconstructLocalVideoReferenceSources";
import { useSelectedTrackIds } from "@domains/track/useSelectedTrackIds";
import { useSetSelectedTrackIds } from "@domains/track/useSetSelectedTrackIds";
import { frameRangeOf } from "@domains/track/utils/frameCoordinates";
import { getTrackAssetData } from "@domains/track/utils/getTrackAssetData";
import { getTrackRenderSettings } from "@domains/track/utils/getTrackRenderSettings";
import { getTrackSources } from "@domains/track/utils/getTrackSources";
import { isMaskTrack } from "@domains/track/utils/isMaskTrack";
import { isTrackPinnable } from "@domains/track/utils/isTrackPinnable";
import { getToolForEngine } from "@hooks/tool/getToolForEngine";
import { useTool } from "@hooks/tool/useTool";
import { RENDER_MODELS } from "@models/video/constants";
import { VideoEngine } from "@models/video/types";
import { Layer } from "@schemas/layer";
import {
  useIsSettingsEditorOpenAtom,
  isIteratedTooltipVisibleAtom,
  isSettingsPastedInfoBlockVisibleAtom,
  useInputTrackIdAtom
} from "@store/atoms";
import { trackRangeAtom } from "@store/atoms/trackRangeAtom";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { cn } from "@utils";
import { useAtomValue, useSetAtom } from "jotai";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { LayerPreview } from "./LayerPreview";
import { ThumbnailPreview } from "./ThumbnailPreview";
import { TrackDetails } from "./TrackDetails";
import { TimelineTrackSettings } from "./TrackDetails/TimelineTrackSettings";
interface TrackItemProps {
  track: Layer;
  trackIdWithDoneStatus: Layer["id"] | undefined | null;
  setRenamingTrackId: (id: Layer["id"] | null) => void;
}

export const RenderTrackItem: React.FC<TrackItemProps> = ({
  track,
  trackIdWithDoneStatus,
  setRenamingTrackId
}) => {
  const [isHiddenWhileDeleting, setIsHiddenWhileDeleting] = useState(false);

  const setSelectedTrackIds = useSetSelectedTrackIds();
  const setIsSettingsEditorOpen = useSetAtom(useIsSettingsEditorOpenAtom());
  const setIsSettingsPastedInfoBlockVisible = useSetAtom(
    isSettingsPastedInfoBlockVisibleAtom
  );
  const { loadSettingsAtom, applyMaskAsInpaintingInputAtom } =
    useRenderSettingsAtoms();
  const onLoadSettings = useSetAtom(loadSettingsAtom);
  const applyMaskAsInpaintingInput = useSetAtom(applyMaskAsInpaintingInputAtom);
  const { setTool } = useTool();
  const inputTrackIdAtom = useInputTrackIdAtom();
  const setInputTrackId = useSetAtom(inputTrackIdAtom);
  const setTrackRange = useSetAtom(trackRangeAtom);
  const { t } = useTranslation();

  const projectId = useSelectedProjectId();
  const { data: project } = useProject(projectId);
  const { pinTrack, unpinTrack } = useUpdatePinnedTrackIds(projectId);
  const pinnedTrackIds = project?.settings?.pinnedTrackIds ?? {};
  const isPinned = pinnedTrackIds[track.timeline_id] === track.id;

  const handlePin = () => {
    if (isPinned) {
      void unpinTrack(track.timeline_id);
    } else {
      void pinTrack(track.timeline_id, track.id);
    }
  };

  const isRenderTrackRowVisible = !isHiddenWhileDeleting;

  const selectedTrackIds = useSelectedTrackIds();
  const isTrackSelected = selectedTrackIds.includes(track.id);
  const isSourceOfSelectedTrack = selectedTrackIds.some((selectedId) =>
    track.derivedTrackIds?.includes(selectedId)
  );

  const renderSettings = getTrackRenderSettings(track);
  const { isFinished, status } = useResolvedQueueStatus({
    trackId: track.id,
    assetStatus: getTrackAssetData(track)?.queue_status
  });
  const canPin = isTrackPinnable(status);
  const trackModel = RENDER_MODELS.find(
    (m) => m.name === renderSettings?.mago_engine
  );
  const isReuseDisabled = trackModel?.status === "deprecated";
  const canUseMaskAsInpaintingInput = isMaskTrack(track) && isFinished;

  const handleUseMaskAsInpaintingInput = () => {
    setTool("render-video");
    applyMaskAsInpaintingInput(track.id);
    setIsSettingsEditorOpen(true);
  };

  const setIsIteratedTooltipVisible = useSetAtom(isIteratedTooltipVisibleAtom);

  const handleIterate = () => {
    setInputTrackId(track.id);
    setSelectedTrackIds([track.id]);
    setIsSettingsEditorOpen(true);
    setTrackRange(frameRangeOf(track));
    setIsIteratedTooltipVisible(true);
  };

  const handleReuse = () => {
    if (!renderSettings) {
      console.error("No render settings found");
      return;
    }
    const targetTool = getToolForEngine(
      renderSettings.mago_engine as VideoEngine | undefined
    );
    setTool(targetTool);
    const parsedSources = parseSourcesForFrontend({
      sources: getTrackSources(track),
      render_settings: {
        magov2: renderSettings as Record<string, unknown> | undefined
      }
    });
    const trackSources =
      parsedSources.length > 0
        ? parsedSources
        : reconstructLocalVideoReferenceSources(
            renderSettings.mago_engine as string | undefined,
            renderSettings as Record<string, unknown>
          );
    onLoadSettings({
      values: renderSettings,
      sources: trackSources,
      targetTool
    });
    setIsSettingsEditorOpen(true);
    setIsSettingsPastedInfoBlockVisible(true);
  };
  const isIterable = isFinished;

  const inputTrackId = useAtomValue(inputTrackIdAtom);
  const isInputTrack = inputTrackId === track.id;

  if (!isRenderTrackRowVisible) {
    return null;
  }

  return (
    <div className="relative h-full w-full">
      <div className="relative flex mb-3">
        <div
          className={cn(
            "relative h-20 flex justify-around items-center px-1 border-l-2 w-full",
            isTrackSelected || isSourceOfSelectedTrack
              ? "border-l-glyph-action-main"
              : "border-l-transparent"
          )}
        >
          {isInputTrack && (
            <Icon
              iconSet="16-technical"
              iconName="video"
              className="absolute top-1 left-2 text-code-200"
            />
          )}
          <Tooltip
            textContent={
              canPin || isPinned
                ? t("buttonTooltips.pin_to_global_preview.label")
                : t("buttonTooltips.pin_to_global_preview.disabledTooltip")
            }
            placement="top"
          >
            <IconActionButton
              icon={
                <Icon
                  iconSet={isPinned ? "16-filled" : "16"}
                  iconName="pin"
                  className={isPinned ? "text-glyph-warning" : undefined}
                />
              }
              onPress={handlePin}
              isDisabled={!canPin && !isPinned}
              aria-label={t("actions.pin_track.label")}
              aria-pressed={isPinned}
            />
          </Tooltip>
          <Tooltip
            textContent={t("buttonTooltips.reuse_settings.label")}
            placement="top"
          >
            <IconActionButton
              aria-label={`Reuse settings from track ${track.name}`}
              icon={<Icon iconSet="16" iconName="reuse" />}
              isDisabled={isReuseDisabled}
              onPress={handleReuse}
            />
          </Tooltip>
          <Tooltip
            textContent={t("buttonTooltips.iterate_render.label")}
            placement="top"
          >
            <IconActionButton
              aria-label="Use track as input"
              icon={<Icon iconSet="16" iconName="edit-video" />}
              onPress={handleIterate}
              isDisabled={!isIterable}
            />
          </Tooltip>
        </div>
        <div className="flex flex-col w-full relative">
          <div
            data-testid="track-settings-details"
            className="absolute flex flex-col h-full justify-end z-10 pt-1.5 pl-6 gap-1 pb-8 pointer-events-none"
          >
            {isFinished && <ThumbnailPreview layer={track} />}
            <TrackDetails
              shouldDisplayDoneIndicator={track.id === trackIdWithDoneStatus}
              track={track}
              setRenamingTrackId={setRenamingTrackId}
              setIsHiddenWhileDeleting={setIsHiddenWhileDeleting}
              onUseAsInpaintingMask={
                canUseMaskAsInpaintingInput
                  ? handleUseMaskAsInpaintingInput
                  : undefined
              }
            />
          </div>
          <LayerPreview track={track} />
          <TimelineTrackSettings track={track} />
        </div>
      </div>
    </div>
  );
};
