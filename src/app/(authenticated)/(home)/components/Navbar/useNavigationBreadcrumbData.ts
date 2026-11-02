"use client";

import { ROUTES } from "@config/constants";
import { useRenameShotItem } from "@domains/project/useRenameShotItem";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { useSelectedShot } from "@domains/shot/useSelectedShot";
import { usePathname } from "next/navigation";

export const useNavigationBreadcrumbData = () => {
  const pathname = usePathname();
  const selectedProjectId = useSelectedProjectId();
  const { data: selectedShot } = useSelectedShot();
  const { renameItem } = useRenameShotItem(selectedProjectId);

  const isProjectPage =
    pathname?.startsWith(ROUTES.PROJECT) &&
    !pathname?.startsWith(ROUTES.PROJECT_TIMELINE);
  const isProjectTimelinePage = pathname?.startsWith(ROUTES.PROJECT_TIMELINE);
  const showBreadcrumb =
    !!selectedProjectId && (isProjectPage || isProjectTimelinePage);
  const showShotName = !!selectedShot;

  const handleRenameShot = (newName: string) => {
    if (!selectedShot) return;
    void renameItem(selectedShot.id, newName);
  };

  return {
    showBreadcrumb,
    showShotName,
    shotName: selectedShot?.name ?? "",
    handleRenameShot
  };
};
