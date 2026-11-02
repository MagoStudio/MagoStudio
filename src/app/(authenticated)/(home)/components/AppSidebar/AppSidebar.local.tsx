import { BulkRenderingPanel } from "@components/BulkRenderingPanel/BulkRenderingPanel";
import { PlansPanel } from "@components/PlansPanel/PlansPanel";
import { QueuePanel } from "@components/QueuePanel/QueuePanel";
import { ROUTES } from "@config/constants";
import { UserMenu } from "@home/components/Navbar/UserMenu";
import { trackingUtils } from "@hooks/tracking/trackingUtils";
import { useAppSidebarCollapse } from "@hooks/userLocalStorage/useAppSidebarCollapse";
import { useIsTeamMember } from "@hooks/userLocalStorage/useIsTeamMember";
import { Show } from "@platform/identity";
import { bulkRenderingFlowAtom, isPlayingAtom } from "@store/atoms";
import { useAtom, useSetAtom } from "jotai";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import { SidebarCollapseToggle } from "./SidebarCollapseToggle";
import { SidebarGlobalEntries } from "./SidebarGlobalEntries";
import { SidebarHomeLink } from "./SidebarHomeLink";
import { SidebarLogo } from "./SidebarLogo";
import { SidebarLogoMark } from "./SidebarLogoMark";
import { SidebarProjectTypeLinks } from "./SidebarProjectTypeLinks";

type SidebarPanel = "queue" | "plans" | null;

export const AppSidebar: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const [openSidebarPanel, setOpenSidebarPanel] = useState<SidebarPanel>(null);
  const [bulkRenderingFlow, setBulkRenderingFlow] = useAtom(
    bulkRenderingFlowAtom
  );
  const setIsPlaying = useSetAtom(isPlayingAtom);
  const isTeamMember = useIsTeamMember();
  const { isAppSidebarCollapsed, toggleAppSidebarCollapse } =
    useAppSidebarCollapse();

  const isBulkRenderingPanelOpen = bulkRenderingFlow?.view === "panel";
  const isQueueDrawerOpen =
    openSidebarPanel === "queue" && !isBulkRenderingPanelOpen;
  const isPlansDrawerOpen =
    openSidebarPanel === "plans" && !isBulkRenderingPanelOpen;
  const expandedHistoryRunId = isBulkRenderingPanelOpen
    ? bulkRenderingFlow.expandedHistoryRunId
    : undefined;

  const closeBulkRenderingPanelIfOpen = () => {
    setBulkRenderingFlow((currentFlow) =>
      currentFlow?.view === "panel" ? null : currentFlow
    );
  };

  const onLogoPress = () => {
    router.push(ROUTES.HOME);
    setOpenSidebarPanel(null);
    closeBulkRenderingPanelIfOpen();
    setIsPlaying(false);
  };

  const onToggleQueueDrawer = () => {
    closeBulkRenderingPanelIfOpen();
    setOpenSidebarPanel((currentPanel) => {
      const isQueueDrawerCurrentlyVisible =
        currentPanel === "queue" && !isBulkRenderingPanelOpen;
      const nextPanel = isQueueDrawerCurrentlyVisible ? null : "queue";
      trackingUtils.queueActions.panelVisibility(
        nextPanel === "queue" ? "open" : "close"
      );
      return nextPanel;
    });
  };

  const onCloseQueueDrawer = () => {
    setOpenSidebarPanel(null);
    trackingUtils.queueActions.panelVisibility("close");
  };

  const onTogglePlansDrawer = () => {
    closeBulkRenderingPanelIfOpen();
    setOpenSidebarPanel((currentPanel) => {
      const isPlansDrawerCurrentlyVisible =
        currentPanel === "plans" && !isBulkRenderingPanelOpen;
      return isPlansDrawerCurrentlyVisible ? null : "plans";
    });
  };

  const onToggleBulkRenderingPanel = () => {
    setOpenSidebarPanel(null);
    setBulkRenderingFlow((currentFlow) =>
      currentFlow?.view === "panel"
        ? null
        : { view: "panel", expandedHistoryRunId: undefined }
    );
  };

  const onCloseBulkRenderingPanel = () => {
    setOpenSidebarPanel(null);
    setBulkRenderingFlow(null);
  };

  return (
    <>
      <Show when="signed-in">
        <nav
          aria-label={t("app_sidebar.navigation.label")}
          className="relative z-10 flex flex-col shrink-0 w-[var(--app-sidebar-current-width)] h-full bg-surface-primary border-r border-glyph-invert-main"
        >
          {isAppSidebarCollapsed ? (
            <div className="flex flex-col items-center shrink-0">
              <div className="flex items-center h-toolbar">
                <SidebarLogoMark onPress={onLogoPress} />
              </div>
              <SidebarCollapseToggle
                isAppSidebarCollapsed={isAppSidebarCollapsed}
                onToggle={toggleAppSidebarCollapse}
              />
              <div className="hidden">
                <UserMenu />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 h-toolbar shrink-0 px-3">
              <SidebarLogo onPress={onLogoPress} />
              <SidebarCollapseToggle
                isAppSidebarCollapsed={isAppSidebarCollapsed}
                onToggle={toggleAppSidebarCollapse}
              />
            </div>
          )}
          {!isAppSidebarCollapsed && (
            <>
              <div className="flex flex-col gap-1">
                <SidebarHomeLink />
                <SidebarProjectTypeLinks />
              </div>
              <div className="mt-auto">
                <SidebarGlobalEntries
                  isPlansDrawerOpen={isPlansDrawerOpen}
                  isQueueDrawerOpen={isQueueDrawerOpen}
                  isBulkRenderingPanelOpen={isBulkRenderingPanelOpen}
                  onTogglePlansDrawer={onTogglePlansDrawer}
                  onToggleQueueDrawer={onToggleQueueDrawer}
                  onToggleBulkRenderingPanel={onToggleBulkRenderingPanel}
                />
              </div>
            </>
          )}
        </nav>
      </Show>
      {isQueueDrawerOpen &&
        createPortal(
          <QueuePanel onClose={onCloseQueueDrawer} />,
          document.body
        )}
      {isPlansDrawerOpen &&
        createPortal(
          <PlansPanel onClose={() => setOpenSidebarPanel(null)} />,
          document.body
        )}
      {isTeamMember && isBulkRenderingPanelOpen && (
        <BulkRenderingPanel
          onClose={onCloseBulkRenderingPanel}
          expandedHistoryRunId={expandedHistoryRunId}
        />
      )}
    </>
  );
};
