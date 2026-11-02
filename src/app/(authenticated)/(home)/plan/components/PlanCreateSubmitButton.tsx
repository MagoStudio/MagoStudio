import { CreditCoin } from "@components/CreditCoin";
import { MainButton } from "@components/MainButton";
import { PlanShotImageUpload } from "@domains/plan/usePlanShotImageAssignments";
import { getSelectedShotImageAssignments } from "@domains/plan/utils/getSelectedShotImageAssignments";
import { sumPlanCost } from "@domains/plan/utils/sumPlanCost";
import { useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

interface PlanCreateSubmitButtonProps {
  img2imgCostPerShot: number;
  fullShots: boolean;
  sharedVideoCostPerShot: number;
  fullShotVideoCostById: Record<string, number>;
  shots: Array<{ id: string; name: string }>;
  uploads: PlanShotImageUpload[];
  manualOverrides: Record<string, string | null>;
  isDisabled?: boolean;
}

export const PlanCreateSubmitButton: React.FC<PlanCreateSubmitButtonProps> = ({
  img2imgCostPerShot,
  fullShots,
  sharedVideoCostPerShot,
  fullShotVideoCostById,
  shots,
  uploads,
  manualOverrides,
  isDisabled
}) => {
  const { t } = useTranslation();
  const timelineIds = useWatch<{ timeline_ids: string[] }, "timeline_ids">({
    name: "timeline_ids"
  });
  const { assignments, hasPendingUploads, selectedShots } =
    getSelectedShotImageAssignments({
      shots,
      timelineIds: timelineIds ?? [],
      uploads,
      manualOverrides
    });
  const shotIdsSkippingImg2Img = new Set(
    assignments
      .filter((assignment) => assignment.status === "matched")
      .map((assignment) => assignment.shotId)
  );
  const hasUnresolvedShotImages =
    hasPendingUploads ||
    assignments.some((assignment) => assignment.status === "needs_review");
  const totalCost = sumPlanCost({
    selectedIds: selectedShots.map((shot) => shot.id),
    img2imgCostPerShot,
    fullShots,
    sharedVideoCostPerShot,
    fullShotVideoCostById,
    shotIdsSkippingImg2Img
  });

  return (
    <MainButton
      variant="solid"
      size="md"
      fullWidth
      type="submit"
      isDisabled={isDisabled || hasUnresolvedShotImages}
    >
      {t("plan.submit.label")}
      <CreditCoin
        count={totalCost}
        color="glyph-primary"
        weight="bold"
        marginLeft
      />
    </MainButton>
  );
};
