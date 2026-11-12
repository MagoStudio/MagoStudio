import { AssetDownloadIndicator } from "@components/AssetDownloadIndicator";
import { CloseButton } from "@components/CloseButton";
import { GhostButton } from "@components/GhostButton";
import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { OverlayDialog } from "@components/OverlayDialog";
import { PlayButton } from "@components/PlayButton";
import { Text } from "@components/Text";
import { useCachedVideoPreview } from "@domains/asset/useCachedVideoPreview";
import { useShotVersionComments } from "@domains/scriptProject/useShotVersionComments";
import { useShotVersionRatings } from "@domains/scriptProject/useShotVersionRatings";
import { useViewedShotVersionIds } from "@domains/scriptProject/useViewedShotVersionIds";
import { buildAspectFitStyle } from "@domains/scriptProject/utils/buildAspectFitStyle";
import { formatShotTitle } from "@domains/scriptProject/utils/formatShotTitle";
import { hasCutShotVersionRenderFailed } from "@domains/scriptProject/utils/hasCutShotVersionRenderFailed";
import { isCutShotVersionShownAsRendering } from "@domains/scriptProject/utils/isCutShotVersionShownAsRendering";
import { CutShotVersionsInDisplayOrder } from "@domains/scriptProject/utils/orderCutShotVersionsForDisplay";
import { ProjectOutputSize } from "@domains/scriptProject/utils/projectOutputSize";
import { resolveCutShotVersionVideo } from "@domains/scriptProject/utils/resolveCutShotVersionVideo";
import { SHOT_FPS } from "@domains/scriptProject/utils/snapShotFrames";
import { CutShot, CutShotVersion } from "@schemas/scriptProject";
import { cn } from "@utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { CutShotVersionRenderError } from "./CutShotVersionRenderError";
import { CutShotVersionRenderSettingsBadge } from "./CutShotVersionRenderSettingsBadge";
import { CutShotVersionReviewNotes } from "./CutShotVersionReviewNotes";
import { CutShotVersionSettingsButton } from "./CutShotVersionSettingsButton";
import { RenderMetricsBadge } from "./RenderMetricsBadge";

const TICKS = 5;
const FULL_PERCENT = 100;
const SECONDS_PER_MINUTE = 60;
const TIME_LABEL_PAD_LENGTH = 4;
const SYNC_TOLERANCE_SECONDS = 0.08;
const formatTime = (value: number) => {
  const seconds = Number.isFinite(value) ? Math.max(0, value) : 0;
  const minutes = Math.floor(seconds / SECONDS_PER_MINUTE);
  return `${minutes}:${(seconds - minutes * SECONDS_PER_MINUTE).toFixed(1).padStart(TIME_LABEL_PAD_LENGTH, "0")}`;
};

const VersionPreview: React.FC<{
  shot: CutShot;
  version: CutShotVersion;
  outputSize: ProjectOutputSize;
  register: (id: string, video: HTMLVideoElement | null) => void;
  setVersionDuration: (id: string, duration: number) => void;
  onPlay: (assetId: string) => void;
}> = ({ shot, version, outputSize, register, setVersionDuration, onPlay }) => {
  const { t } = useTranslation();
  const versionVideo = resolveCutShotVersionVideo(shot, version);
  const isVersionPlayable =
    version.ready && !isCutShotVersionShownAsRendering(shot, version);
  const { videoFirstFrameUrl, playableVideoUrl } = useCachedVideoPreview({
    assetId: versionVideo.videoAssetId,
    videoUrl: versionVideo.videoUrl,
    fps: SHOT_FPS,
    enabled: isVersionPlayable
  });
  const ref = useCallback(
    (video: HTMLVideoElement | null) => register(version.asset_id, video),
    [register, version.asset_id]
  );
  return (
    <div
      style={buildAspectFitStyle(outputSize)}
      className="relative mx-auto flex max-h-[min(42vh,400px)] items-center justify-center overflow-hidden rounded-lg bg-surface-primary"
    >
      {isVersionPlayable && versionVideo.videoAssetId && (
        <AssetDownloadIndicator assetId={versionVideo.videoAssetId} />
      )}
      {isVersionPlayable && playableVideoUrl ? (
        <video
          ref={ref}
          src={playableVideoUrl}
          poster={videoFirstFrameUrl ?? versionVideo.posterUrl ?? undefined}
          muted
          playsInline
          preload="auto"
          onPlay={() => onPlay(version.asset_id)}
          onLoadedMetadata={(event) =>
            setVersionDuration(version.asset_id, event.currentTarget.duration)
          }
          className="h-full w-full object-contain"
          data-testid={`cut-version-option-video-${version.asset_id}`}
        />
      ) : hasCutShotVersionRenderFailed(version) ? (
        <CutShotVersionRenderError
          shotTimelineId={shot.timeline_id}
          version={version}
        />
      ) : versionVideo.posterUrl ? (
        <img
          src={versionVideo.posterUrl}
          alt=""
          className="h-full w-full object-contain opacity-60"
        />
      ) : (
        <Text variant="2xs" color="glyph-tertiary">
          {t("script_project.version_not_ready.label")}
        </Text>
      )}
      <RenderMetricsBadge
        assetId={version.asset_id}
        kind="video"
        hasRenderFinished={isVersionPlayable}
      />
    </div>
  );
};

type Props = {
  projectId?: string;
  shot: CutShot;
  outputSize: ProjectOutputSize;
  versionsInDisplayOrder: CutShotVersionsInDisplayOrder;
  shownVersionAssetId: string;
  isOpen: boolean;
  isBusy: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onPin: (assetId: string | null) => void;
  onReuseSettings: (version: CutShotVersion) => void;
};

export const CutShotVersionDialog: React.FC<Props> = ({
  projectId,
  shot,
  outputSize,
  versionsInDisplayOrder,
  shownVersionAssetId,
  isOpen,
  isBusy,
  onOpenChange,
  onPin,
  onReuseSettings
}) => {
  const { t } = useTranslation();
  const { ratingsByAssetId, setVersionRating } = useShotVersionRatings(
    projectId ?? ""
  );
  const { commentsByAssetId, setVersionComment, appendScoringReview } =
    useShotVersionComments(projectId ?? "");
  const { markVersionsViewed } = useViewedShotVersionIds(projectId ?? "");
  const videos = useRef(new Map<string, HTMLVideoElement>());
  const durations = useRef(new Map<string, number>());
  const frame = useRef<number | null>(null);
  const startedAt = useRef(0);
  const startedFrom = useRef(0);
  const timeRef = useRef(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoCount, setVideoCount] = useState(0);

  const cancelFrame = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
  }, []);
  const pause = useCallback(() => {
    cancelFrame();
    videos.current.forEach((video) => video.pause());
    setIsPlaying(false);
  }, [cancelFrame]);
  const seek = useCallback((value: number) => {
    const next = Math.max(0, value);
    videos.current.forEach((video) => {
      const at = Math.min(next, video.duration || next);
      if (Number.isFinite(at)) video.currentTime = at;
    });
    timeRef.current = next;
    setCurrentTime(next);
  }, []);
  const register = useCallback((id: string, video: HTMLVideoElement | null) => {
    if (video) videos.current.set(id, video);
    else videos.current.delete(id);
    setVideoCount(videos.current.size);
  }, []);
  const setVersionDuration = useCallback((id: string, value: number) => {
    if (!Number.isFinite(value) || value <= 0) return;
    durations.current.set(id, value);
    setDuration(Math.max(0, ...durations.current.values()));
  }, []);
  const tick = useCallback(function playbackTick() {
    const next =
      startedFrom.current + (performance.now() - startedAt.current) / 1000;
    const end = Math.max(0, ...durations.current.values());
    if (end > 0 && next >= end) {
      videos.current.forEach((video) => video.pause());
      timeRef.current = end;
      setCurrentTime(end);
      setIsPlaying(false);
      frame.current = null;
      return;
    }
    videos.current.forEach((video) => {
      if (
        next < video.duration &&
        Math.abs(video.currentTime - next) > SYNC_TOLERANCE_SECONDS
      )
        video.currentTime = next;
    });
    timeRef.current = next;
    setCurrentTime(next);
    frame.current = requestAnimationFrame(playbackTick);
  }, []);
  const play = () => {
    if (!videos.current.size) return;
    const start = duration > 0 && currentTime >= duration ? 0 : currentTime;
    seek(start);
    startedFrom.current = start;
    startedAt.current = performance.now();
    videos.current.forEach((video) => void video.play().catch(() => undefined));
    setIsPlaying(true);
    cancelFrame();
    frame.current = requestAnimationFrame(tick);
  };
  useEffect(() => () => cancelFrame(), [cancelFrame]);
  const close = (open: boolean) => {
    if (!open) {
      pause();
      seek(0);
    }
    onOpenChange(open);
  };
  const {
    versionsNewestFirst,
    displayedPinnedVersionAssetId,
    versionNumberByAssetId
  } = versionsInDisplayOrder;

  return (
    <OverlayDialog
      isOpen={isOpen}
      onOpenChange={close}
      size={{ mode: "inset", insetXPx: 32, insetYPx: 56 }}
      className="overflow-hidden"
    >
      <div className="relative flex h-full w-full flex-col gap-6 p-8">
        <div className="absolute right-4 top-4">
          <CloseButton onPress={() => close(false)} />
        </div>
        <Text component="h4" variant="xl" weight="semibold">
          {t("script_project.shot_versions_title.label", {
            shot: formatShotTitle({
              heading: shot.heading,
              shotIndex: shot.shot_index
            })
          })}
        </Text>
        <div
          className="flex min-h-0 flex-1 items-start gap-4 overflow-x-auto pb-2 scrollbar-custom"
          data-testid={`cut-version-options-${shot.timeline_id}`}
        >
          {versionsNewestFirst.map((version) => {
            const isVersionShown = version.asset_id === shownVersionAssetId;
            const isVersionPinned =
              displayedPinnedVersionAssetId === version.asset_id;
            const versionName = t("script_project.version_number.label", {
              number: versionNumberByAssetId.get(version.asset_id)
            });
            const rating = ratingsByAssetId[version.asset_id] ?? 0;
            const comments = commentsByAssetId[version.asset_id] ?? {
              good: "",
              bad: "",
              todo: ""
            };
            return (
              <article
                key={version.asset_id}
                className={cn(
                  "flex w-[360px] shrink-0 flex-col gap-3 rounded-xl border p-3",
                  isVersionShown
                    ? "border-glyph-action-main"
                    : "border-element-primary"
                )}
                data-testid={`cut-version-option-${version.asset_id}`}
              >
                <VersionPreview
                  shot={shot}
                  version={version}
                  outputSize={outputSize}
                  register={register}
                  setVersionDuration={setVersionDuration}
                  onPlay={(assetId) => markVersionsViewed([assetId])}
                />
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Text
                      variant="2xs"
                      color="glyph-tertiary"
                      className="truncate"
                    >
                      {versionName}
                    </Text>
                    <CutShotVersionRenderSettingsBadge
                      version={version}
                      className="pointer-events-none min-w-0 shrink-0"
                      testId={`cut-version-render-settings-${version.asset_id}`}
                    />
                    <CutShotVersionSettingsButton
                      version={version}
                      versionName={versionName}
                      isBusy={isBusy}
                      onReuseSettings={onReuseSettings}
                    />
                  </div>
                  <div className="flex gap-1">
                    <IconActionButton
                      size="xs"
                      variant="transparent"
                      icon={
                        rating === 1 ? (
                          <Icon iconSet="16-filled" iconName="thumb-up" />
                        ) : (
                          <Icon iconSet="16" iconName="like-line" />
                        )
                      }
                      aria-label={t(
                        "script_project.rate_version_up_button.label"
                      )}
                      aria-pressed={rating === 1}
                      onPress={() =>
                        setVersionRating(version.asset_id, rating === 1 ? 0 : 1)
                      }
                    />
                    <IconActionButton
                      size="xs"
                      variant="transparent"
                      icon={
                        rating === -1 ? (
                          <Icon iconSet="16-filled" iconName="thumb-down" />
                        ) : (
                          <Icon iconSet="16" iconName="dislike-line" />
                        )
                      }
                      aria-label={t(
                        "script_project.rate_version_down_button.label"
                      )}
                      aria-pressed={rating === -1}
                      onPress={() =>
                        setVersionRating(
                          version.asset_id,
                          rating === -1 ? 0 : -1
                        )
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isVersionPinned ? (
                    <GhostButton
                      colorScheme="white"
                      isDisabled={isBusy}
                      onPress={() => onPin(null)}
                      data-testid={`cut-version-unpin-${version.asset_id}`}
                    >
                      {t("script_project.unpin_shot_version_button.label")}
                    </GhostButton>
                  ) : isVersionShown ? (
                    <Text variant="2xs" color="glyph-action-main">
                      {t("script_project.shot_version_current.label")}
                    </Text>
                  ) : (
                    <GhostButton
                      colorScheme="white"
                      isDisabled={
                        isBusy ||
                        !version.ready ||
                        isCutShotVersionShownAsRendering(shot, version)
                      }
                      onPress={() => onPin(version.asset_id)}
                      data-testid={`cut-version-use-${version.asset_id}`}
                    >
                      {t("script_project.pin_button.label")}
                    </GhostButton>
                  )}
                </div>
                <CutShotVersionReviewNotes
                  assetId={version.asset_id}
                  hasRenderFinished={
                    version.ready &&
                    !isCutShotVersionShownAsRendering(shot, version)
                  }
                  comments={comments}
                  onChangeComment={(field, comment) =>
                    setVersionComment(version.asset_id, field, comment)
                  }
                  appendScoringReview={appendScoringReview}
                />
              </article>
            );
          })}
        </div>
        <div className="grid shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-xl bg-surface-primary p-3">
          <PlayButton
            isPlaying={isPlaying}
            isDisabled={videoCount === 0}
            onPress={isPlaying ? pause : play}
            aria-label={t(
              isPlaying
                ? "script_project.pause_all_versions_button.label"
                : "script_project.play_all_versions_button.label"
            )}
          />
          <div
            className="relative h-12"
            data-testid="shot-version-comparison-timeline"
          >
            <div className="absolute inset-x-0 top-5 h-1 rounded-full bg-element-primary" />
            {Array.from({ length: TICKS }, (_, index) => {
              const percent = (index / (TICKS - 1)) * FULL_PERCENT;
              return (
                <div
                  key={index}
                  className="pointer-events-none absolute top-1 -translate-x-1/2"
                  style={{ left: `${percent}%` }}
                >
                  <Text variant="2xs" color="glyph-tertiary">
                    {formatTime((duration * percent) / FULL_PERCENT)}
                  </Text>
                  <div className="mx-auto mt-1 h-3 w-px bg-glyph-tertiary" />
                </div>
              );
            })}
            <div
              className={cn(
                "pointer-events-none absolute bottom-0 top-4 z-10 w-0.5 -translate-x-1/2",
                isPlaying ? "bg-glyph-error" : "bg-glyph-action-secondary"
              )}
              style={{
                left: `${duration > 0 ? (currentTime / duration) * FULL_PERCENT : 0}%`
              }}
              data-testid="shot-version-comparison-playhead"
            />
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={1 / SHOT_FPS}
              value={Math.min(currentTime, duration || 0)}
              disabled={duration <= 0}
              aria-label={t("script_project.compare_versions_timeline.label")}
              onChange={(event) => {
                pause();
                seek(Number(event.target.value));
              }}
              className="absolute inset-x-0 top-3 z-20 h-6 w-full cursor-pointer opacity-0 disabled:cursor-default"
            />
          </div>
          <Text variant="xs" color="glyph-secondary" className="tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </Text>
        </div>
      </div>
    </OverlayDialog>
  );
};
