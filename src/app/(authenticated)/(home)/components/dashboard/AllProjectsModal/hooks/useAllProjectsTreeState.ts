import { useProjectList } from "@domains/project/useProjectList";
import { useProjects } from "@domains/project/useProjects";
import { pickProjectCoverImageUrl } from "@domains/project/utils/pickProjectCoverImageUrl";
import { resolveProjectPreviewUrl } from "@domains/project/utils/resolveProjectPreviewUrl";
import { useCreateProjectFoldersFolder } from "@home/components/dashboard/shared/hooks/useCreateProjectFoldersFolder";
import { useProjectFolders } from "@hooks/projectFolders/useProjectFolders";
import { useProjectFoldersSorting } from "@hooks/projectFolders/useProjectFoldersSorting";
import { useSyncProjectsToFolders } from "@hooks/projectFolders/useSyncProjectsToFolders";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { isLocalApp } from "@/platform/localDesktop";

export const useAllProjectsTreeState = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const { data: folderData, isLoading: isFoldersLoading } = useProjectFolders();
  const { allItems: projectListItems, isLoading: isProjectListLoading } =
    useProjectList({ perPage: 500 });
  const { data: allProjects, isLoading: isAllProjectsLoading } = useProjects();
  const { mutateAsync: createFolder } = useCreateProjectFoldersFolder();
  const { sortBy, sortDirection, setSortBy, toggleSortDirection, sortItems } =
    useProjectFoldersSorting();

  useSyncProjectsToFolders();

  const isLoading =
    !isLocalApp &&
    (isFoldersLoading || isProjectListLoading || isAllProjectsLoading);

  const allItems = useMemo(
    () => folderData?.projectFoldersAndProjects || [],
    [folderData?.projectFoldersAndProjects]
  );

  const previewUrlById = useMemo(() => {
    const map: Record<string, string | undefined> = {};
    for (const item of projectListItems) {
      map[item.id] = resolveProjectPreviewUrl(
        item.id,
        pickProjectCoverImageUrl(item)
      );
    }
    return map;
  }, [projectListItems]);

  const selectedSortKey =
    sortBy === "alphabetical" ? "alphabetically" : "lastEdited";

  const sortOptions = useMemo(
    () => [
      {
        key: "alphabetically",
        label: t("actions.sort_alphabetically.label")
      },
      {
        key: "lastEdited",
        label: t("actions.sort_last_edited.label")
      }
    ],
    [t]
  );

  const handleSortChange = (key: string) => {
    setSortBy(key === "lastEdited" ? "lastEdited" : "alphabetical");
  };

  return {
    search,
    setSearch,
    isLoading,
    allItems,
    allProjects,
    previewUrlById,
    sortItems,
    sortOptions,
    selectedSortKey,
    handleSortChange,
    sortDirection,
    toggleSortDirection,
    createFolder
  };
};
