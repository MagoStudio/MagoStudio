"use client";

import { ProjectDataWarning } from "@app/components/LibraryHealth";
import { CircularProgress } from "@components/CircularProgress";
import { Icon } from "@components/Icon";
import { TabMenuRegular } from "@components/TabMenuRegular";
import { Text } from "@components/Text";
import { useProject } from "@domains/project/useProject";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { SCRIPT_PROJECT_TAB_IDS } from "@domains/scriptProject/constants";
import { useFailedShotTimelineIds } from "@domains/scriptProject/useFailedShotTimelineIds";
import { useInProgressSheetTokens } from "@domains/scriptProject/useInProgressSheetTokens";
import { useInProgressShotTimelineIds } from "@domains/scriptProject/useInProgressShotTimelineIds";
import { useMigrateRetiredShotRenderEngine } from "@domains/scriptProject/useMigrateRetiredShotRenderEngine";
import { useProjectScriptVersions } from "@domains/scriptProject/useProjectScriptVersions";
import { useProjectState } from "@domains/scriptProject/useProjectState";
import { useProjectTypeRedirect } from "@domains/scriptProject/useProjectTypeRedirect";
import { useRecoverableCastingRun } from "@domains/scriptProject/useRecoverableCastingRun";
import { useRefreshCutWhileShotsRender } from "@domains/scriptProject/useRefreshCutWhileShotsRender";
import { useRefreshScriptProjectRunOutputs } from "@domains/scriptProject/useRefreshScriptProjectRunOutputs";
import { useScriptProjectRenderAccess } from "@domains/scriptProject/useScriptProjectRenderAccess";
import { useScriptProjectRun } from "@domains/scriptProject/useScriptProjectRun";
import { useSelectedScriptProjectTabId } from "@domains/scriptProject/useSelectedScriptProjectTabId";
import { useSheetRenderModel } from "@domains/scriptProject/useSheetRenderModel";
import { hasUsableScriptVersion } from "@domains/scriptProject/utils/hasUsableScriptVersion";
import { isStoryboardSheetGroup } from "@domains/scriptProject/utils/isStoryboardSheetGroup";
import { resolveRenderingShotTimelineIds } from "@domains/scriptProject/utils/resolveRenderingShotTimelineIds";
import { withoutStoryboardSheetGroups } from "@domains/scriptProject/utils/withoutStoryboardSheetGroups";
import { AssetsTab } from "@home/script-project/components/AssetsTab";
import { ScriptProjectRunProgress } from "@home/script-project/components/ScriptProjectRunProgress";
import { ScriptProjectStatsTooltip } from "@home/script-project/components/ScriptProjectStatsTooltip";
import { ScriptTab } from "@home/script-project/components/ScriptTab";
import { ShotsTab } from "@home/script-project/components/ShotsTab";
import { TimelineTab } from "@home/script-project/components/TimelineTab";
import { TabPanel, Tabs } from "react-aria-components/Tabs";
import { useTranslation } from "react-i18next";

export default function ScriptProjectPage() {
  const { t } = useTranslation();
  const projectId = useSelectedProjectId();
  const { data: project } = useProject(projectId);
  const canRender = useScriptProjectRenderAccess(projectId);
  const { sheetRenderModel } = useSheetRenderModel(projectId);
  const canRenderSheets = useScriptProjectRenderAccess(
    projectId,
    sheetRenderModel
  );
  const {
    selectedScriptProjectTabId: selectedTabId,
    setSelectedScriptProjectTabId: setSelectedTabId
  } = useSelectedScriptProjectTabId();

  const { data: projectStateWithStoryboards } = useProjectState(projectId);
  const projectState =
    projectStateWithStoryboards &&
    withoutStoryboardSheetGroups(projectStateWithStoryboards);
  const storyboardSheetGroups =
    projectStateWithStoryboards?.keys.filter(isStoryboardSheetGroup) ?? [];
  const { data: versionList } = useProjectScriptVersions(projectId);
  const recoverableCastingRun = useRecoverableCastingRun(projectId ?? "");
  useProjectTypeRedirect(projectId, "script_to_shots");

  const {
    startRun,
    isRunActive,
    runOwnerTabId,
    renderingSheetTokens,
    renderingShotTimelineIds: renderingShotTimelineIdsFromRun,
    runProgressPercent,
    runStepsCompleted,
    runStepsTotal
  } = useScriptProjectRun(
    projectId ?? "",
    setSelectedTabId,
    recoverableCastingRun?.status === "PENDING" ||
      recoverableCastingRun?.status === "RUNNING"
      ? {
          planId: recoverableCastingRun.planId,
          ownerTabId: SCRIPT_PROJECT_TAB_IDS.script,
          advanceToTabId: SCRIPT_PROJECT_TAB_IDS.assets
        }
      : null
  );
  const isCloudScriptProject = project?.origin === "cloud";
  useMigrateRetiredShotRenderEngine(
    isCloudScriptProject ? projectId : undefined,
    isRunActive
  );

  /* The run this tab launched knows its own shots immediately; the backend knows every shot any
   * plan is still working on, including after a reload. A shot counts as rendering if either
   * says so. */
  const inProgressShotTimelineIds = useInProgressShotTimelineIds(projectId);
  useRefreshScriptProjectRunOutputs(projectId);
  const failedShotTimelineIds = useFailedShotTimelineIds(projectId);
  const inProgressSheetTokens = useInProgressSheetTokens(projectId);
  const renderingAssetTokens = new Set([
    ...renderingSheetTokens,
    ...inProgressSheetTokens
  ]);
  const renderingShotTimelineIds = resolveRenderingShotTimelineIds({
    renderingShotTimelineIdsFromRun,
    inProgressShotTimelineIds,
    failedShotTimelineIds
  });
  useRefreshCutWhileShotsRender(projectId, renderingShotTimelineIds);

  if (!projectId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Text variant="sm" color="glyph-tertiary">
          {t("script_project.empty_state.label")}
        </Text>
      </div>
    );
  }

  const runOwnedBy = (tabId: string) => ({
    ownerTabId: tabId,
    advanceToTabId:
      tabId === SCRIPT_PROJECT_TAB_IDS.script
        ? SCRIPT_PROJECT_TAB_IDS.assets
        : undefined
  });

  const startSheetRunFromTab =
    (tabId: string) =>
    (planId: string, sheetTokens: string[] = []) =>
      startRun({ planId, ...runOwnedBy(tabId), sheetTokens });

  const startShotRunFromTab =
    (tabId: string) =>
    (planId: string, shotTimelineIds: string[] = []) =>
      startRun({ planId, ...runOwnedBy(tabId), shotTimelineIds });

  const runningTabIcon = <CircularProgress size="sm" color="glyph-secondary" />;
  /* A project with entities or shots is past casting whatever the version list says. Gating on
   * that list alone meant one unreadable response locked a finished project down to an empty
   * Script tab, with no way to reach the assets and renders it had already paid for. */
  const hasCastEntitiesOrShots =
    (projectState?.keys.length ?? 0) > 0 ||
    (projectState?.shots.length ?? 0) > 0;
  const isScriptSent = hasUsableScriptVersion(versionList);
  const areTabsAfterScriptLocked = !isScriptSent && !hasCastEntitiesOrShots;
  const scriptLockedTabIcon = (
    <Icon iconSet="16" iconName="lock" className="h-3.5 w-3.5" />
  );

  const tabs = [
    {
      id: SCRIPT_PROJECT_TAB_IDS.script,
      name: t("script_project.tab_script.label"),
      tooltip: isScriptSent
        ? t("script_project.script_locked.ariaLabel")
        : undefined,
      icon:
        runOwnerTabId === SCRIPT_PROJECT_TAB_IDS.script
          ? runningTabIcon
          : isScriptSent
            ? scriptLockedTabIcon
            : undefined
    },
    {
      id: SCRIPT_PROJECT_TAB_IDS.assets,
      name: t("script_project.tab_assets.label"),
      isDisabled: areTabsAfterScriptLocked,
      icon:
        runOwnerTabId === SCRIPT_PROJECT_TAB_IDS.assets
          ? runningTabIcon
          : undefined
    },
    {
      id: SCRIPT_PROJECT_TAB_IDS.storyboard,
      name: t("script_project.tab_storyboard.label"),
      isDisabled: areTabsAfterScriptLocked
    },
    {
      id: SCRIPT_PROJECT_TAB_IDS.shots,
      name: t("script_project.tab_shots.label"),
      isDisabled: areTabsAfterScriptLocked,
      icon:
        runOwnerTabId === SCRIPT_PROJECT_TAB_IDS.shots
          ? runningTabIcon
          : undefined
    },
    {
      id: SCRIPT_PROJECT_TAB_IDS.timeline,
      name: t("script_project.tab_timeline.label"),
      isDisabled: areTabsAfterScriptLocked
    }
  ];

  return (
    <div
      data-testid="script-project-page"
      className="relative isolate flex h-full w-full min-w-0 flex-col overflow-hidden"
    >
      <ProjectDataWarning projectId={projectId} />
      <Tabs
        selectedKey={selectedTabId}
        onSelectionChange={(key) => setSelectedTabId(String(key))}
        className="flex h-full min-h-0 flex-col"
      >
        <TabMenuRegular
          tabs={tabs}
          className="gap-4 border-b border-element-primary px-6"
          afterTabs={
            <ScriptProjectStatsTooltip
              projectId={projectId}
              projectState={projectState}
              origin={project?.origin}
            />
          }
        />

        {isRunActive && (
          <ScriptProjectRunProgress
            stepsCompleted={runStepsCompleted}
            stepsTotal={runStepsTotal}
            progressPercent={runProgressPercent}
          />
        )}

        <TabPanel
          id={SCRIPT_PROJECT_TAB_IDS.script}
          className="min-h-0 flex-1 outline-hidden"
        >
          <ScriptTab
            projectId={projectId}
            isRunActive={isRunActive}
            isScriptSent={isScriptSent}
            onRunStarted={startSheetRunFromTab(SCRIPT_PROJECT_TAB_IDS.script)}
          />
        </TabPanel>
        <TabPanel
          id={SCRIPT_PROJECT_TAB_IDS.assets}
          className="min-h-0 flex-1 outline-hidden"
        >
          {projectState && (
            <AssetsTab
              projectId={projectId}
              projectState={projectState}
              renderingSheetTokens={renderingAssetTokens}
              isRunActive={isRunActive}
              canRender={canRenderSheets}
              onRunStarted={startSheetRunFromTab(SCRIPT_PROJECT_TAB_IDS.assets)}
            />
          )}
        </TabPanel>
        <TabPanel
          id={SCRIPT_PROJECT_TAB_IDS.storyboard}
          className="min-h-0 flex-1 outline-hidden"
        >
          {projectState && (
            <ShotsTab
              projectId={projectId}
              projectState={projectState}
              storyboardSheetGroups={storyboardSheetGroups}
              scenesView="storyboard"
              renderingShotTimelineIds={renderingShotTimelineIds}
              failedShotTimelineIds={failedShotTimelineIds}
              isRunActive={isRunActive}
              canRender={canRender}
              onRunStarted={startShotRunFromTab(SCRIPT_PROJECT_TAB_IDS.shots)}
            />
          )}
        </TabPanel>
        <TabPanel
          id={SCRIPT_PROJECT_TAB_IDS.shots}
          className="min-h-0 flex-1 outline-hidden"
        >
          {projectState && (
            <ShotsTab
              projectId={projectId}
              projectState={projectState}
              storyboardSheetGroups={storyboardSheetGroups}
              scenesView="video"
              renderingShotTimelineIds={renderingShotTimelineIds}
              failedShotTimelineIds={failedShotTimelineIds}
              isRunActive={isRunActive}
              canRender={canRender}
              onRunStarted={startShotRunFromTab(SCRIPT_PROJECT_TAB_IDS.shots)}
            />
          )}
        </TabPanel>
        <TabPanel
          id={SCRIPT_PROJECT_TAB_IDS.timeline}
          className="min-h-0 flex-1 outline-hidden"
        >
          <TimelineTab projectId={projectId} />
        </TabPanel>
      </Tabs>
    </div>
  );
}
