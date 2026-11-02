import { Badge } from "@components/Badge";
import { PLAN_STATUS_COLOR_MAP } from "@domains/plan/utils/planStatuses";
import { PlanStatus } from "@schemas/plan";
import { useTranslation } from "react-i18next";

interface PlanStatusBadgeProps {
  status: PlanStatus;
}

export const PlanStatusBadge: React.FC<PlanStatusBadgeProps> = ({ status }) => {
  const { t } = useTranslation();

  return (
    <Badge glyphColor={PLAN_STATUS_COLOR_MAP[status]}>
      {t(`plan.status.${status}.label`)}
    </Badge>
  );
};
