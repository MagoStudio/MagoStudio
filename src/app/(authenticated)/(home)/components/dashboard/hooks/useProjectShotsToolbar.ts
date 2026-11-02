"use client";

import { useBulkUpload } from "@domains/bulkUpload/useBulkUpload";
import { useVideoFileRouting } from "@domains/bulkUpload/useVideoFileRouting";
import { openVideoFilePicker } from "@domains/bulkUpload/utils/openVideoFilePicker";
import { useProjectShotFolders } from "@domains/project/shotFolders/useProjectShotFolders";
import { useShotFoldersSorting } from "@domains/project/shotFolders/useShotFoldersSorting";
import { useCreateShotFolder } from "@domains/project/useCreateShotFolder";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export const useProjectShotsToolbar = (projectId: string | undefined) => {
  const { t } = useTranslation();
  const { data } = useProjectShotFolders(projectId);
  const { mutateAsync: createFolder } = useCreateShotFolder(projectId);

  const {
    startBulkUpload,
    bulkUploadState,
    cancelAllUploads,
    hideBulkUploadPanel
  } = useBulkUpload(projectId);

  const [search, setSearch] = useState("");
  const { sortBy, sortDirection, setSortBy, toggleSortDirection, sortItems } =
    useShotFoldersSorting({
      initialSortBy: "alphabetical",
      initialSortDirection: "asc"
    });

  const sortOptions = [
    {
      key: "alphabetical",
      label: t("actions.sort_alphabetically.label")
    },
    {
      key: "lastEdited",
      label: t("actions.sort_last_edited.label")
    }
  ];
  const handleSortChange = (key: string) => {
    setSortBy(key as "alphabetical" | "lastEdited");
  };
  const hasContent = (data?.shotFoldersAndShots?.length ?? 0) > 0;
  const handleDropFiles = useVideoFileRouting(projectId, startBulkUpload);
  const handleUploadVideos = () => openVideoFilePicker(handleDropFiles);
  return {
    search,
    setSearch,
    sortOptions,
    selectedSortKey: sortBy,
    handleSortChange,
    sortDirection,
    toggleSortDirection,
    sortItems,
    hasContent,
    createFolder,
    handleUploadVideos,
    handleDropFiles,
    bulkUploadState,
    cancelAllUploads,
    hideBulkUploadPanel
  };
};
