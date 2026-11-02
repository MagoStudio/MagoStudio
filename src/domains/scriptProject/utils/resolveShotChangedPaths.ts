type ShotDryRunDiff = {
  changed: Record<string, string[]>;
  changed_by_timeline_id: Record<string, string[]>;
};

type ShotIdentity = {
  timeline_id: string;
  sequence_id: number | null;
  key?: string | null;
};

export const resolveShotChangedPaths = (
  dryRun: ShotDryRunDiff | undefined,
  shot: ShotIdentity
): string[] | undefined => {
  const displayKey =
    shot.key ?? (shot.sequence_id === null ? null : String(shot.sequence_id));

  return (
    dryRun?.changed_by_timeline_id[shot.timeline_id] ??
    (displayKey === null ? undefined : dryRun?.changed[displayKey])
  );
};
