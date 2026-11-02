import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { Text } from "@components/Text";
import { usePlans } from "@domains/plan/usePlans";
import { ACTIVE_PLAN_STATUSES } from "@domains/plan/utils/planStatuses";
import { useIsTeamMember } from "@hooks/userLocalStorage/useIsTeamMember";
import { Dialog } from "react-aria-components/Dialog";
import { useHotkeys } from "react-hotkeys-hook";
import { useTranslation } from "react-i18next";

import { PlansSection } from "./PlansSection";

interface PlansPanelProps {
  onClose: () => void;
  isEnabled?: boolean;
}

export const PlansPanel: React.FC<PlansPanelProps> = ({
  onClose,
  isEnabled
}) => {
  const { t } = useTranslation();
  const isTeamMember = useIsTeamMember();
  const { data: allPlans } = usePlans({
    enabled: isEnabled ?? isTeamMember
  });

  const activePlans = allPlans?.filter((plan) =>
    ACTIVE_PLAN_STATUSES.has(plan.status)
  );

  const endedPlans = allPlans
    ?.filter((plan) => !ACTIVE_PLAN_STATUSES.has(plan.status))
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  useHotkeys("escape", () => onClose(), { enabled: true }, [onClose]);

  return (
    <div data-testid="drawer-isolate-root" className="isolate">
      <div
        data-testid="drawer-scrim"
        className="fixed inset-0 z-0"
        onMouseDown={onClose}
        aria-hidden="true"
      />
      <div
        data-testid="plans-panel"
        className="absolute right-0 top-14 bottom-2 z-10 w-[672px] flex flex-col bg-surface-secondary-opacity-90 backdrop-blur-[10px] rounded-[20px] shadow-[0px_0px_16px_0px_rgba(0,0,0,0.6)] overflow-hidden"
      >
        <Dialog
          aria-label={t("plans_panel.title.label")}
          className="outline-hidden h-full flex flex-col"
        >
          <div className="flex items-center gap-2 pl-4 pr-3 py-4 shrink-0">
            <Text
              component="p"
              variant="md"
              weight="bold"
              color="glyph-primary"
              className="flex-1"
            >
              {t("plans_panel.title.label")}
            </Text>
            <IconActionButton
              icon={<Icon iconSet="24" iconName="close" />}
              size="sm"
              onPress={onClose}
              aria-label={t("actions.close.label")}
              className="shrink-0"
            />
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-custom px-4 pb-4">
            <div className="flex flex-col gap-6">
              <PlansSection
                title={t("plans_panel.section_in_progress.label")}
                plans={activePlans}
                onClose={onClose}
              />
              <PlansSection
                title={t("plans_panel.section_ended.label")}
                plans={endedPlans}
                onClose={onClose}
              />
            </div>
          </div>
        </Dialog>
      </div>
    </div>
  );
};
