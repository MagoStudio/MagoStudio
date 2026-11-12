import { AssetDownloadIndicator } from "@components/AssetDownloadIndicator";
import { PlayButton } from "@components/PlayButton";
import { Text } from "@components/Text";
import { useAssetDownloadState } from "@domains/asset/useAssetDownloadPriority";
import { buildAspectFitStyle } from "@domains/scriptProject/utils/buildAspectFitStyle";
import { CutTimelineClip } from "@domains/scriptProject/utils/buildCutTimelineClips";
import { findNextPlayableCutClipIndex } from "@domains/scriptProject/utils/findNextPlayableCutClipIndex";
import { cn } from "@utils";
import { useTranslation } from "react-i18next";

import { CutPlayerVideo } from "./CutPlayerVideo";

type Props = {
  clips: CutTimelineClip[];
  activeClipIndex: number;
  outputSize: [number, number];
  isCutPlaying: boolean;
  canCutPlay: boolean;
  onTogglePlayback: () => void;
  onClipPlay: (playedVersionAssetId: string | null) => void;
  onClipEnded: () => void;
  onClipError: () => void;
  registerClipVideoElement: (
    clipIndex: number,
    element: HTMLVideoElement | null
  ) => void;
};

export const CutPlayer: React.FC<Props> = ({
  clips,
  activeClipIndex,
  outputSize,
  isCutPlaying,
  canCutPlay,
  onTogglePlayback,
  onClipPlay,
  onClipEnded,
  onClipError,
  registerClipVideoElement
}) => {
  const { t } = useTranslation();
  const activeAssetId = clips[activeClipIndex]?.assetId;
  const downloadState = useAssetDownloadState(activeAssetId);
  const isDownloading =
    downloadState === "queued" || downloadState === "downloading";

  const nextPlayableClipIndex = findNextPlayableCutClipIndex(
    clips,
    activeClipIndex
  );
  const mountedClipIndexes = [activeClipIndex, nextPlayableClipIndex].filter(
    (clipIndex): clipIndex is number =>
      clipIndex !== null && !!clips[clipIndex]?.isClipPlayable
  );

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center [container-type:size]">
      <div
        className="group relative flex items-center justify-center overflow-hidden rounded-xl bg-surface-primary"
        style={buildAspectFitStyle(outputSize, "100cqh")}
        data-testid="script-project-timeline-player"
      >
        {mountedClipIndexes.length === 0 ? (
          <Text variant="sm" color="glyph-tertiary">
            {t("script_project.no_render_yet.label")}
          </Text>
        ) : (
          mountedClipIndexes.map((clipIndex) => (
            <CutPlayerVideo
              key={clips[clipIndex]!.timelineId}
              clip={clips[clipIndex]!}
              isActive={clipIndex === activeClipIndex}
              isClipPlaying={isCutPlaying && clipIndex === activeClipIndex}
              onPlay={onClipPlay}
              onEnded={onClipEnded}
              onError={onClipError}
              registerElement={(element) =>
                registerClipVideoElement(clipIndex, element)
              }
            />
          ))
        )}

        <AssetDownloadIndicator assetId={activeAssetId} />
        {canCutPlay && !isDownloading && (
          <PlayButton
            isPlaying={isCutPlaying}
            onPress={onTogglePlayback}
            aria-label={t(
              isCutPlaying
                ? "script_project.pause_cut_button.label"
                : "script_project.play_cut_button.label"
            )}
            className={cn(
              "absolute size-20 rounded-full bg-transparent text-glyph-primary-on-pic",
              "transition-opacity data-[hovered]:bg-transparent [&_svg]:size-14",
              isCutPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100"
            )}
            data-testid="cut-player-overlay-play"
          />
        )}
      </div>
    </div>
  );
};
