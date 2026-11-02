"use client";

import { Icon } from "@components/Icon";
import { MainButton } from "@components/MainButton";
import { Text } from "@components/Text";
import { ROUTES } from "@config/constants";
import { fetchPlanDetail } from "@domains/plan/fetchPlanDetail";
import { fetchPlanSteps } from "@domains/plan/fetchPlanSteps";
import { extractShotImageAssetIdsFromShotOverrides } from "@domains/plan/utils/extractShotImageAssetIdsFromShotOverrides";
import { getShotImageOverridesFromSteps } from "@domains/plan/utils/getShotImageOverridesFromSteps";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import {
  getProjectModeTabs,
  PLAN_TAB_ID
} from "@home/components/projectModeTabs";
import { useProjectModeNavigation } from "@home/hooks/useProjectModeNavigation";
import { PlanCreateForm } from "@home/plan/components/PlanCreateForm";
import { PlanDetailView } from "@home/plan/components/PlanDetailView";
import { PlanListView } from "@home/plan/components/PlanListView";
import { ProjectModeSelector } from "@home/project/components/ProjectModeSelector";
import { useMountEffect } from "@hooks/useMountEffect";
import { useIsTeamMember } from "@hooks/userLocalStorage/useIsTeamMember";
import { Plan } from "@schemas/plan";
import { useToast } from "@store/useToast";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type ViewState =
  | { kind: "list" }
  | { kind: "detail"; planId: string }
  | {
      kind: "create";
      initialSettings?: Plan["input_data"];
      initialShotImageAssetIdByTimelineId?: Record<string, string>;
    };

export default function PlanPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const isTeamMember = useIsTeamMember();
  const { showHintToast } = useToast();
  const [view, setView] = useState<ViewState>({ kind: "list" });
  const [reusingPlanId, setReusingPlanId] = useState<string | null>(null);
  const reusingInFlightRef = useRef<boolean>(false);

  useMountEffect(() => {
    const planId = new URLSearchParams(window.location.search).get("planId");
    if (planId) setView({ kind: "detail", planId });
  });
  const { handleTabChange } = useProjectModeNavigation();
  const projectModeTabs = getProjectModeTabs({ t, isTeamMember });
  const selectedProjectId = useSelectedProjectId();

  // oxlint-disable-next-line custom-react/no-use-effect -- syncs auth state with router redirect
  useEffect(() => {
    if (!isTeamMember) {
      router.replace("/");
    }
  }, [isTeamMember, router]);

  if (!isTeamMember) {
    return null;
  }

  const handleSelectPlan = (planId: string) => {
    setView({ kind: "detail", planId });
  };

  const handleBackToList = () => {
    setView({ kind: "list" });
    const params = new URLSearchParams(window.location.search);
    params.delete("planId");
    const qs = params.toString();
    router.replace(qs ? `${ROUTES.PLAN}?${qs}` : ROUTES.PLAN, {
      scroll: false
    });
  };

  const handleCreatePlan = () => {
    setView({ kind: "create" });
  };

  const handleReuse = async (planId: string) => {
    if (reusingInFlightRef.current) return;
    reusingInFlightRef.current = true;
    setReusingPlanId(planId);
    try {
      const plan = await fetchPlanDetail(planId);
      const shotOverridesFromInputData =
        extractShotImageAssetIdsFromShotOverrides(
          plan.input_data?.shot_overrides
        );
      let initialShotImageAssetIdByTimelineId = shotOverridesFromInputData;
      if (Object.keys(shotOverridesFromInputData).length === 0) {
        try {
          const steps = await fetchPlanSteps(planId);
          initialShotImageAssetIdByTimelineId =
            getShotImageOverridesFromSteps(steps);
        } catch {
          showHintToast(t("plan.reuse_shot_images_failed.label"));
        }
      }
      setView({
        kind: "create",
        initialSettings: plan.input_data,
        initialShotImageAssetIdByTimelineId
      });
    } catch {
      showHintToast(t("plan.reuse_failed.label"));
    } finally {
      reusingInFlightRef.current = false;
      setReusingPlanId(null);
    }
  };

  return (
    <div
      className="relative isolate flex h-full w-full min-w-0 flex-col overflow-hidden"
      data-testid="plan-page"
    >
      <nav
        aria-label="Secondary navbar"
        className="relative w-full h-12 shrink-0 border-b border-b-glyph-invert-main bg-surface-secondary-opacity-90"
      >
        <div className="flex h-full items-center">
          <ProjectModeSelector
            tabs={projectModeTabs}
            selectedKey={PLAN_TAB_ID}
            onSelectionChange={handleTabChange}
            className="h-full [&>button]:h-full"
          />
        </div>
      </nav>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="flex flex-col gap-6 p-6 w-full">
          {view.kind === "list" && (
            <div className="max-w-3xl">
              <div className="flex items-center justify-between mb-6">
                <Text
                  component="h1"
                  variant="xl"
                  weight="bold"
                  color="glyph-primary"
                >
                  {t("plan.title.label")}
                </Text>
                {selectedProjectId && (
                  <MainButton
                    variant="solid"
                    size="md"
                    onPress={handleCreatePlan}
                    startIcon={<Icon iconSet="16" iconName="plus" />}
                  >
                    {t("plan.create.label")}
                  </MainButton>
                )}
              </div>
              <PlanListView
                onSelectPlan={handleSelectPlan}
                projectId={selectedProjectId}
                onReuse={handleReuse}
                reusingPlanId={reusingPlanId}
              />
            </div>
          )}

          {view.kind === "detail" && (
            <PlanDetailView planId={view.planId} onBack={handleBackToList} />
          )}

          {view.kind === "create" && selectedProjectId && (
            <PlanCreateForm
              projectId={selectedProjectId}
              onCreated={handleBackToList}
              onCancel={handleBackToList}
              initialSettings={view.initialSettings}
              initialShotImageAssetIdByTimelineId={
                view.initialShotImageAssetIdByTimelineId
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
