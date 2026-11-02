import { SidebarMenuButton } from "@components/SidebarMenuButton";
import { usePlans } from "@domains/plan/usePlans";
import { ACTIVE_PLAN_STATUSES } from "@domains/plan/utils/planStatuses";
import { useIsTeamMember } from "@hooks/userLocalStorage/useIsTeamMember";
import { useTranslation } from "react-i18next";

interface Props {
  onClick: () => void;
  isSelected: boolean;
}

export const PlansNavButton: React.FC<Props> = ({ onClick, isSelected }) => {
  const { t } = useTranslation();
  const isTeamMember = useIsTeamMember();
  const { data: allPlans } = usePlans({ enabled: isTeamMember });

  const activePlanCount =
    allPlans?.filter((plan) => ACTIVE_PLAN_STATUSES.has(plan.status)).length ??
    0;

  return (
    <SidebarMenuButton
      aria-label={t("plans_panel.title.label")}
      onClick={onClick}
      selected={isSelected}
    >
      {activePlanCount
        ? `${t("plans_panel.title.label")} (${activePlanCount})`
        : t("plans_panel.title.label")}
    </SidebarMenuButton>
  );
};
