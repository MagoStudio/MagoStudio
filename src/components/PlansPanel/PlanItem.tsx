import { ROUTES } from "@config/constants";
import { PlanListItem } from "@home/plan/components/PlanListItem";
import { PlanSummary } from "@schemas/plan";
import { useRouter, useSearchParams } from "next/navigation";

interface PlanItemProps {
  plan: PlanSummary;
  onClose: () => void;
}

export const PlanItem: React.FC<PlanItemProps> = ({ plan, onClose }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleClick = () => {
    onClose();
    const params = new URLSearchParams();
    params.set("planId", plan.id);
    const projectId = searchParams.get("projectId");
    if (projectId) params.set("projectId", projectId);
    router.push(`${ROUTES.PLAN}?${params.toString()}`);
  };

  return <PlanListItem plan={plan} onClick={handleClick} />;
};
