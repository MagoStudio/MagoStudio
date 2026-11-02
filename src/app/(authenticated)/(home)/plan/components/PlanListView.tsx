import { CircularProgress } from "@components/CircularProgress";
import { TabMenuRegular } from "@components/TabMenuRegular";
import { Text } from "@components/Text";
import { usePlans } from "@domains/plan/usePlans";
import {
  countByStatus,
  filterPlansByTab,
  PlanFilterTab
} from "@domains/plan/utils/filterPlans";
import { HIDDEN_FROM_ALL_TAB } from "@domains/plan/utils/planStatuses";
import { useState } from "react";
import { Tabs, TabPanel } from "react-aria-components";
import { useTranslation } from "react-i18next";

import { PlanListItem } from "./PlanListItem";

interface PlanListViewProps {
  onSelectPlan: (planId: string) => void;
  projectId?: string;
  onReuse?: (planId: string) => void;
  reusingPlanId?: string | null;
}

function formatTabName(name: string, count: number | undefined) {
  if (count === undefined) return name;
  return `${name} (${count})`;
}

export const PlanListView: React.FC<PlanListViewProps> = ({
  onSelectPlan,
  projectId,
  onReuse,
  reusingPlanId
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<PlanFilterTab>("all");
  const { data: fetchedPlans, isLoading } = usePlans({ projectId });
  const allPlans = projectId
    ? fetchedPlans?.filter(
        (p) => p.project_id === undefined || p.project_id === projectId
      )
    : fetchedPlans;

  const counts = allPlans ? countByStatus(allPlans) : {};
  const allCount = allPlans
    ? allPlans.filter((p) => !HIDDEN_FROM_ALL_TAB.has(p.status)).length
    : undefined;

  const tabs = [
    {
      id: "all",
      name: formatTabName(t("plan.filter_all.label"), allCount)
    },
    {
      id: "RUNNING",
      name: formatTabName(
        t("plan.filter_running.label"),
        (counts.RUNNING ?? 0) + (counts.PENDING ?? 0) + (counts.PAUSED ?? 0) ||
          undefined
      )
    },
    {
      id: "COMPLETED",
      name: formatTabName(t("plan.filter_completed.label"), counts.COMPLETED)
    },
    {
      id: "FAILED",
      name: formatTabName(t("plan.filter_failed.label"), counts.FAILED)
    },
    {
      id: "CANCELLED",
      name: formatTabName(t("plan.filter_cancelled.label"), counts.CANCELLED)
    }
  ];

  const filteredPlans = allPlans ? filterPlansByTab(allPlans, activeTab) : [];

  return (
    <div className="flex flex-col gap-4">
      <Tabs
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as PlanFilterTab)}
      >
        <TabMenuRegular tabs={tabs} />
        <TabPanel id={activeTab} className="pt-4">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <CircularProgress />
            </div>
          )}
          {!isLoading && filteredPlans.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <Text variant="sm" color="glyph-secondary">
                {t("plan.no_plans.label")}
              </Text>
            </div>
          )}
          {!isLoading && filteredPlans.length > 0 && (
            <div className="flex flex-col gap-2">
              {filteredPlans.map((plan) => (
                <PlanListItem
                  key={plan.id}
                  plan={plan}
                  onClick={onSelectPlan}
                  onReuse={onReuse}
                  isReusing={reusingPlanId === plan.id}
                />
              ))}
            </div>
          )}
        </TabPanel>
      </Tabs>
    </div>
  );
};
