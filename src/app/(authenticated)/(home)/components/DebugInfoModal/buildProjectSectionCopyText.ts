const PLACEHOLDER = "—";

interface ProjectSectionData {
  projectId: string;
  selectedShotId: string | null | undefined;
  selectedTrackIds: string[];
  assetId: string;
  filepath: string;
  queueId: string;
}

export function buildProjectSectionCopyText(
  t: (key: string) => string,
  {
    projectId,
    selectedShotId,
    selectedTrackIds,
    assetId,
    filepath,
    queueId
  }: ProjectSectionData
): string {
  const shotId = selectedShotId ?? PLACEHOLDER;
  const trackIds =
    selectedTrackIds.length > 0 ? selectedTrackIds.join(", ") : PLACEHOLDER;

  return [
    `## ${t("titles.current_project.label")}`,
    `${t("titles.project_id.label")}: ${projectId}`,
    `${t("titles.shot_id.label")}: ${shotId}`,
    `${t("titles.track_ids.label")}: ${trackIds}`,
    `${t("titles.asset_id.label")}: ${assetId}`,
    `${t("titles.filepath.label")}: ${filepath}`,
    `${t("titles.queue_id.label")}: ${queueId}`
  ].join("\n");
}
