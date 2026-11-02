type ShotDryRunAnswer = {
  would_run: (number | null)[];
  would_run_timeline_ids: string[];
};

type ShotIdentity = {
  timeline_id: string;
  sequence_id: number | null;
};

export const resolveWouldRunShotTimelineIds = (
  dryRun: ShotDryRunAnswer | undefined,
  shots: ShotIdentity[]
): string[] => {
  if (!dryRun) return [];

  const hasPerBeatTimelineIds = dryRun.would_run_timeline_ids.length > 0;
  if (hasPerBeatTimelineIds) return dryRun.would_run_timeline_ids;

  const wouldRunSequenceIds = new Set(dryRun.would_run);
  return shots
    .filter(
      (shot) =>
        shot.sequence_id !== null && wouldRunSequenceIds.has(shot.sequence_id)
    )
    .map((shot) => shot.timeline_id);
};
