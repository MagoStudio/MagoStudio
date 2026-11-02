import { Text } from "@components/Text";
import { PlanSummary } from "@schemas/plan";

import { PlanItem } from "./PlanItem";

interface PlansSectionProps {
  title: string;
  plans: PlanSummary[] | undefined;
  onClose: () => void;
}

export const PlansSection: React.FC<PlansSectionProps> = ({
  title,
  plans,
  onClose
}) => {
  if (!plans || plans.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <Text variant="sm" weight="bold" color="glyph-primary">
        {title}
      </Text>
      <div className="flex flex-col gap-1">
        {plans.map((plan) => (
          <PlanItem key={plan.id} plan={plan} onClose={onClose} />
        ))}
      </div>
    </div>
  );
};
