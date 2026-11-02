import { MainButton } from "@components/MainButton";
import { Text } from "@components/Text";
import { useCutShotDurations } from "@domains/scriptProject/useCutShotDurations";
import { useExportCut } from "@domains/scriptProject/useExportCut";
import { useProjectCut } from "@domains/scriptProject/useProjectCut";
import { useProjectOutputSize } from "@domains/scriptProject/useProjectOutputSize";
import { useShotsByDropped } from "@domains/scriptProject/useShotsByDropped";
import { buildCutTimelineClips } from "@domains/scriptProject/utils/buildCutTimelineClips";
import { filterCutToActiveScript } from "@domains/scriptProject/utils/filterCutToActiveScript";
import { useTranslation } from "react-i18next";

import { CutExportFailedDialog } from "./CutExportFailedDialog";
import { CutPlayer } from "./CutTimeline/CutPlayer";
import { CutTimeline } from "./CutTimeline/CutTimeline";
import { useCutPlayback } from "./CutTimeline/hooks/useCutPlayback";

type Props = {
  projectId: string;
};

export const TimelineTab: React.FC<Props> = ({ projectId }) => {
  const { t } = useTranslation();

  const { data: cut } = useProjectCut(projectId);
  const { outputSize, shotFrames } = useProjectOutputSize(projectId);
  const { shotsDroppedByRecast } = useShotsByDropped(projectId);
  const { cutShotsInActiveScript: shots } = filterCutToActiveScript(
    cut,
    shotsDroppedByRecast
  );
  const {
    downloadCut,
    downloadOneShot,
    downloadCutAsZipAndDismiss,
    isExportingCut,
    isDownloadingCut,
    downloadableShotCount,
    expectedRefusal,
    failedExport,
    dismissFailedExport
  } = useExportCut(projectId, shots, cut?.export?.url);

  const { durationSecondsByAssetId, isEveryDurationSettled } =
    useCutShotDurations(shots);
  const { clips, totalDurationFrames } = buildCutTimelineClips(
    shots,
    durationSecondsByAssetId,
    shotFrames
  );

  const {
    activeClipIndex,
    isCutPlaying,
    canCutPlay,
    playheadRef,
    toggleCutPlayback,
    seekCutToPercent,
    registerClipVideoElement,
    handleActiveClipEnded,
    handleActiveClipError
  } = useCutPlayback({ clips, totalDurationFrames });

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {failedExport && (
        <CutExportFailedDialog
          isOpen
          reasonLabel={t(failedExport.labelKey, {
            shots: failedExport.shotNumbers.join(", ")
          })}
          isDownloadingZip={isDownloadingCut}
          onCancel={dismissFailedExport}
          onDownloadZip={() => void downloadCutAsZipAndDismiss()}
        />
      )}
      <div className="flex items-center justify-end gap-3 border-b border-element-primary px-6 py-3">
        {expectedRefusal && (
          <Text variant="xs" color="glyph-tertiary">
            {t("script_project.export_will_be_separate_files.label")}
          </Text>
        )}
        <MainButton
          colorScheme="primary"
          isDisabled={downloadableShotCount === 0 || isExportingCut}
          loading={isExportingCut}
          onPress={() => void downloadCut()}
          data-testid="script-project-download-cut"
        >
          {expectedRefusal
            ? t("script_project.download_shots_button.label")
            : t("script_project.download_cut_button.label")}
        </MainButton>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 p-6">
        <CutPlayer
          clips={clips}
          activeClipIndex={activeClipIndex}
          outputSize={outputSize}
          isCutPlaying={isCutPlaying}
          canCutPlay={canCutPlay}
          onTogglePlayback={toggleCutPlayback}
          onClipEnded={handleActiveClipEnded}
          onClipError={handleActiveClipError}
          registerClipVideoElement={registerClipVideoElement}
        />

        <CutTimeline
          clips={clips}
          totalDurationFrames={totalDurationFrames}
          activeClipIndex={activeClipIndex}
          isCutPlaying={isCutPlaying}
          isEveryDurationSettled={isEveryDurationSettled}
          playheadRef={playheadRef}
          onSeekToPercent={seekCutToPercent}
          onDownloadClip={(clip) => {
            const cutShot = shots.find(
              (shot) => shot.timeline_id === clip.timelineId
            );
            if (cutShot) void downloadOneShot(cutShot);
          }}
        />
      </div>
    </div>
  );
};
