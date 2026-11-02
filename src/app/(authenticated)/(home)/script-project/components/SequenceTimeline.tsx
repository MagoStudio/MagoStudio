import { Icon } from "@components/Icon";
import { Text } from "@components/Text";
import { useRenderMetrics } from "@domains/scriptProject/useRenderMetrics";
import { useViewedShotVersionIds } from "@domains/scriptProject/useViewedShotVersionIds";
import { orderCutShotVersionsForDisplay } from "@domains/scriptProject/utils/orderCutShotVersionsForDisplay";
import { getRenderMetricsVerdict } from "@domains/scriptProject/utils/summariseRenderMetrics";
import { CutShot, ShotState } from "@schemas/scriptProject";
import { cn } from "@utils";
import { useTranslation } from "react-i18next";

type Props = {
  projectId: string;
  shots: ShotState[];
  cutShots: CutShot[];
  isLocalProject: boolean;
  renderingShotTimelineIds: ReadonlySet<string>;
  changedShotTimelineIds: ReadonlySet<string>;
  onSelect: (timelineId: string) => void;
};

type ItemProps = {
  shot: ShotState;
  cutShot: CutShot | undefined;
  isLocalProject: boolean;
  isNew: boolean;
  isRendering: boolean;
  isChanged: boolean;
  isSequential: boolean;
  onSelect: () => void;
};

const SHOT_INDEX_PAD_LENGTH = 2;

const SCORE_STYLE = {
  pass: "bg-glyph-success-opacity-10 text-glyph-success",
  fail: "bg-glyph-error/10 text-glyph-error",
  pending: "bg-glyph-warning/10 text-glyph-warning",
  error: "bg-glyph-warning/10 text-glyph-warning",
  none: "bg-glyph-warning/10 text-glyph-warning"
} as const;

const SequenceTimelineItem: React.FC<ItemProps> = ({
  shot,
  cutShot,
  isLocalProject,
  isNew,
  isRendering,
  isChanged,
  isSequential,
  onSelect
}) => {
  const { t } = useTranslation();
  const { shownVersion } = orderCutShotVersionsForDisplay(cutShot, new Map());
  const { data: metrics } = useRenderMetrics(
    shownVersion?.asset_id,
    "video",
    shownVersion?.ready === true && !isLocalProject
  );
  const verdict = getRenderMetricsVerdict(metrics ?? undefined);
  const scoreLabel =
    typeof metrics?.score === "number"
      ? t("script_project.sequence_timeline_score.label", {
          score: metrics.score.toFixed(1)
        })
      : null;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group relative flex h-20 w-48 shrink-0 flex-col gap-1.5 rounded-lg border border-element-primary bg-surface-secondary px-2.5 py-2 text-left outline-hidden transition-[width,border-color] duration-100 hover:w-80 hover:border-glyph-action-main focus-visible:w-80 focus-visible:ring-1 focus-visible:ring-glyph-action-main"
      data-testid={`sequence-timeline-item-${shot.timeline_id}`}
    >
      {isSequential && (
        <span
          className="absolute -left-3 top-1/2 z-10 flex size-3 -translate-y-1/2 items-center justify-center bg-surface-primary text-glyph-action-main"
          data-testid={`sequence-timeline-sequential-${shot.timeline_id}`}
          aria-label={t("script_project.sequence_timeline_sequential.label")}
        >
          <Icon iconSet="16" iconName="chevron-right" className="!size-3" />
        </span>
      )}
      <span className="absolute -right-3 top-1/2 h-px w-3 bg-element-primary group-last:hidden" />
      <span className="flex h-8 min-w-0 items-start gap-1.5 overflow-hidden">
        <Text variant="2xs" color="glyph-tertiary" className="shrink-0">
          {String(shot.shot_index + 1).padStart(SHOT_INDEX_PAD_LENGTH, "0")}
        </Text>
        <Text
          variant="xs"
          weight="semibold"
          className="line-clamp-2 min-w-0 leading-4"
        >
          {shot.heading}
        </Text>
      </span>
      <span className="flex h-5 items-center gap-1 overflow-hidden whitespace-nowrap">
        <span
          className={cn(
            "inline-flex h-5 items-center gap-1 rounded px-1.5 font-lato text-2xs",
            shot.locked
              ? "bg-glyph-success-opacity-10 text-glyph-success"
              : "bg-element-primary text-glyph-tertiary"
          )}
        >
          <Icon
            iconSet="16"
            iconName={shot.locked ? "lock" : "unlock"}
            className="!h-3 !w-3"
          />
          {t(
            shot.locked
              ? "script_project.shot_lock_status_locked.label"
              : "script_project.shot_lock_status_unlocked.label"
          )}
        </span>
        {isNew && (
          <span className="inline-flex h-5 items-center rounded bg-element-additional-active px-1.5 font-lato text-2xs text-glyph-primary-on-pic">
            {t("script_project.version_new_badge.label")}
          </span>
        )}
        {isRendering && (
          <span className="inline-flex h-5 items-center gap-1 rounded bg-glyph-action-main/10 px-1.5 font-lato text-2xs text-glyph-action-main">
            <span className="size-1.5 animate-pulse rounded-full bg-current" />
            {t("script_project.sequence_timeline_rendering.label")}
          </span>
        )}
        {isChanged && (
          <span
            className="inline-flex h-5 items-center gap-1 rounded bg-glyph-warning/10 px-1.5 font-lato text-2xs text-glyph-warning"
            title={t("script_project.sequence_timeline_changed_help.label")}
            data-testid={`sequence-timeline-changed-${shot.timeline_id}`}
          >
            <span className="size-1.5 rounded-full bg-current" />
            {t("script_project.sequence_timeline_changed.label")}
          </span>
        )}
        {scoreLabel && (
          <span
            className={cn(
              "inline-flex h-5 items-center gap-1 rounded px-1.5 font-lato text-2xs",
              SCORE_STYLE[verdict]
            )}
            data-testid={`sequence-timeline-score-${shot.timeline_id}`}
          >
            <span className="size-1.5 rounded-full bg-current" />
            {scoreLabel}
          </span>
        )}
      </span>
    </button>
  );
};

export const SequenceTimeline: React.FC<Props> = ({
  projectId,
  shots,
  cutShots,
  isLocalProject,
  renderingShotTimelineIds,
  changedShotTimelineIds,
  onSelect
}) => {
  const { t } = useTranslation();
  const { viewedVersionIds } = useViewedShotVersionIds(projectId);

  return (
    <section
      className="flex shrink-0 flex-col gap-2"
      aria-label={t("script_project.sequence_timeline.label")}
      data-testid="sequence-timeline"
    >
      <Text variant="xs" weight="semibold" color="glyph-secondary">
        {t("script_project.sequence_timeline.label")}
      </Text>
      <div
        className="flex min-h-[calc(5rem+var(--width-scrollbar)+0.25rem)] items-start gap-3 overflow-x-auto pb-1 scrollbar-custom"
        data-testid="sequence-timeline-scroll"
      >
        {shots.map((shot) => {
          const cutShot = cutShots.find(
            (candidate) => candidate.timeline_id === shot.timeline_id
          );
          return (
            <SequenceTimelineItem
              key={shot.timeline_id}
              shot={shot}
              cutShot={cutShot}
              isLocalProject={isLocalProject}
              isNew={
                cutShot?.versions.some(
                  (version) =>
                    !version.timeline_upscale_of &&
                    version.ready &&
                    !viewedVersionIds.has(version.asset_id)
                ) ?? false
              }
              isRendering={renderingShotTimelineIds.has(shot.timeline_id)}
              isChanged={changedShotTimelineIds.has(shot.timeline_id)}
              isSequential={shot.sequential?.enabled === true}
              onSelect={() => onSelect(shot.timeline_id)}
            />
          );
        })}
      </div>
    </section>
  );
};
