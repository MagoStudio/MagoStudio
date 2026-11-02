import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { useQueueItemForTrack } from "@domains/queue/useQueueItemForTrack";
import { useSelectedShotId } from "@domains/shot/useSelectedShotId";
import { useSelectedTrackIds } from "@domains/track/useSelectedTrackIds";
import { useTranslation } from "react-i18next";

import { buildProjectSectionCopyText } from "./buildProjectSectionCopyText";
import { DebugInfoRow } from "./DebugInfoRow";
import { DebugInfoSection } from "./DebugInfoSection";

const PLACEHOLDER = "—";

export function DebugInfoProjectSection() {
  const { t } = useTranslation();
  const projectId = useSelectedProjectId() ?? PLACEHOLDER;
  const { selectedShotId } = useSelectedShotId();
  const selectedTrackIds = useSelectedTrackIds();
  const { data: queueItem, filepath: rawFilepath } = useQueueItemForTrack({
    trackId: selectedTrackIds[0]
  });

  const shotId = selectedShotId ?? PLACEHOLDER;
  const trackIds =
    selectedTrackIds.length > 0 ? selectedTrackIds.join(", ") : PLACEHOLDER;
  const assetId = queueItem?.asset_id ?? PLACEHOLDER;
  const filepath = rawFilepath || PLACEHOLDER;
  const queueId = queueItem?.id ?? PLACEHOLDER;

  const copyText = buildProjectSectionCopyText(t, {
    projectId,
    selectedShotId,
    selectedTrackIds,
    assetId,
    filepath,
    queueId
  });

  return (
    <DebugInfoSection
      title={t("titles.current_project.label")}
      copyText={copyText}
    >
      <DebugInfoRow label={t("titles.project_id.label")} value={projectId} />
      <DebugInfoRow label={t("titles.shot_id.label")} value={shotId} />
      <DebugInfoRow label={t("titles.track_ids.label")} value={trackIds} />
      <DebugInfoRow label={t("titles.asset_id.label")} value={assetId} />
      <DebugInfoRow label={t("titles.filepath.label")} value={filepath} />
      <DebugInfoRow label={t("titles.queue_id.label")} value={queueId} />
    </DebugInfoSection>
  );
}
