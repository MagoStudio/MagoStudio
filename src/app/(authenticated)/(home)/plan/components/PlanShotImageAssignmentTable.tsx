import { ShotImageAssignment } from "@domains/plan/utils/matchShotImagesToFilenames";

import { PlanShotImageAssignmentRow } from "./PlanShotImageAssignmentRow";

interface Props {
  shots: Array<{ id: string; name: string }>;
  assignments: ShotImageAssignment[];
  doneUploads: Array<{ uploadKey: string; fileName: string }>;
  onManualOverrideChange: (shotId: string, assetId: string | null) => void;
}

export const PlanShotImageAssignmentTable: React.FC<Props> = ({
  shots,
  assignments,
  doneUploads,
  onManualOverrideChange
}) => {
  if (doneUploads.length === 0) return null;

  const shotNameById = new Map(shots.map((shot) => [shot.id, shot.name]));

  return (
    <div className="flex flex-col gap-1 divide-y divide-glyph-disabled/20">
      {assignments.map((assignment) => (
        <PlanShotImageAssignmentRow
          key={assignment.shotId}
          shotName={shotNameById.get(assignment.shotId) ?? assignment.shotId}
          assignment={assignment}
          doneUploads={doneUploads}
          onChange={(assetId) =>
            onManualOverrideChange(assignment.shotId, assetId)
          }
        />
      ))}
    </div>
  );
};
