const EXPANDED_APP_SIDEBAR_WIDTH = "var(--width-app-sidebar)";
const COLLAPSED_APP_SIDEBAR_WIDTH = "calc(var(--spacing) * 12)";
const ABSENT_APP_SIDEBAR_WIDTH = "0px";

type AppSidebarState = {
  showsAppSidebar: boolean;
  isAppSidebarCollapsed: boolean;
};

export const resolveAppSidebarWidth = ({
  showsAppSidebar,
  isAppSidebarCollapsed
}: AppSidebarState): string => {
  if (!showsAppSidebar) return ABSENT_APP_SIDEBAR_WIDTH;
  if (isAppSidebarCollapsed) return COLLAPSED_APP_SIDEBAR_WIDTH;
  return EXPANDED_APP_SIDEBAR_WIDTH;
};
