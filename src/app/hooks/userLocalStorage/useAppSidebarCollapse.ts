import { UserLocalStorage } from "../constants";

import { useUserLocalStorage } from "./useUserLocalStorage";

const appSidebarCollapsedKey = "appSidebarCollapsed";

export const useAppSidebarCollapse = () => {
  const [isAppSidebarCollapsed, setIsAppSidebarCollapsed] = useUserLocalStorage<
    UserLocalStorage[typeof appSidebarCollapsedKey]
  >(appSidebarCollapsedKey, false);

  return {
    isAppSidebarCollapsed: Boolean(isAppSidebarCollapsed),
    toggleAppSidebarCollapse: () =>
      setIsAppSidebarCollapsed(
        (wasAppSidebarCollapsed) => !wasAppSidebarCollapsed
      )
  };
};
