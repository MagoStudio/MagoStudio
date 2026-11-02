import { Text } from "@components/Text";
import { PlanShotImageUpload } from "@domains/plan/usePlanShotImageAssignments";
import { getSelectedShotImageAssignments } from "@domains/plan/utils/getSelectedShotImageAssignments";
import { useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { PlanShotImageAssignmentTable } from "./PlanShotImageAssignmentTable";
import { PlanShotImageUnmatchedNotice } from "./PlanShotImageUnmatchedNotice";
import { PlanShotImageUploadZone } from "./PlanShotImageUploadZone";

interface Props {
  shots: Array<{ id: string; name: string }>;
  uploads: PlanShotImageUpload[];
  manualOverrides: Record<string, string | null>;
  onUpload: (files: File[]) => void;
  onRemoveUpload: (id: string) => void;
  onManualOverrideChange: (shotId: string, assetId: string | null) => void;
}

export const PlanShotImagesSection: React.FC<Props> = ({
  shots,
  uploads,
  manualOverrides,
  onUpload,
  onRemoveUpload,
  onManualOverrideChange
}) => {
  const { t } = useTranslation();
  const timelineIds = useWatch<{ timeline_ids: string[] }, "timeline_ids">({
    name: "timeline_ids"
  });
  const { assignments, unmatchedUploads, selectedShots, doneUploads } =
    getSelectedShotImageAssignments({
      shots,
      timelineIds: timelineIds ?? [],
      uploads,
      manualOverrides
    });

  return (
    <div className="flex flex-col gap-2">
      <Text variant="sm" weight="medium" color="glyph-secondary">
        {t("plan.shot_images.title.label")}
      </Text>
      <Text variant="2xs" color="glyph-tertiary">
        {t("plan.shot_images.hint.label")}
      </Text>
      <PlanShotImageUploadZone
        uploads={uploads}
        onUpload={onUpload}
        onRemoveUpload={onRemoveUpload}
      />
      <PlanShotImageAssignmentTable
        shots={selectedShots}
        assignments={assignments}
        doneUploads={doneUploads}
        onManualOverrideChange={onManualOverrideChange}
      />
      <PlanShotImageUnmatchedNotice unmatchedUploads={unmatchedUploads} />
    </div>
  );
};
