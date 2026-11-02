"use client";

import { MainButton } from "@components/MainButton";
import { ModalWithToolbar } from "@home/components/dashboard/ModalWithToolbar";
import { ProjectRow } from "@home/components/dashboard/ProjectRow";
import { keepFolderTreeProjectsOfType } from "@hooks/projectFolders/utils/keepFolderTreeProjectsOfType";
import { ProjectType } from "@schemas/scriptProject";
import { useTranslation } from "react-i18next";

import { AddProjectFolderButton } from "./AddProjectFolderButton";
import { AllProjectsTree } from "./AllProjectsTree";
import { useAllProjectsTreeState } from "./hooks/useAllProjectsTreeState";

const LOADING_PLACEHOLDER_COUNT = 8;

type Props = {
  onClose: () => void;
  onCreateProject?: () => void;
  listedProjectType?: ProjectType;
};

export const AllProjectsModal: React.FC<Props> = ({
  onClose,
  onCreateProject,
  listedProjectType
}) => {
  const { t } = useTranslation();
  const {
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
  } = useAllProjectsTreeState();

  const listedItems = listedProjectType
    ? keepFolderTreeProjectsOfType({
        folderTreeItems: allItems,
        projects: allProjects ?? [],
        projectType: listedProjectType
      })
    : allItems;

  const handleCreateProject = () => {
    onClose();
    onCreateProject?.();
  };

  const primaryAction = onCreateProject ? (
    <MainButton onPress={handleCreateProject}>
      {t("actions.create_project.label")}
    </MainButton>
  ) : undefined;

  return (
    <ModalWithToolbar
      open
      onClose={onClose}
      title={t("titles.all_projects_modal.label")}
      search={search}
      onSearchChange={setSearch}
      sortOptions={sortOptions}
      selectedSortKey={selectedSortKey}
      onSortChange={handleSortChange}
      sortDirection={sortDirection}
      onToggleSortDirection={toggleSortDirection}
      primaryAction={primaryAction}
      secondaryActions={
        <AddProjectFolderButton onPress={() => void createFolder()} />
      }
    >
      <div
        className="flex-1 min-h-0 overflow-y-auto scrollbar-custom flex flex-col"
        data-testid="all-projects-modal-list"
      >
        {isLoading &&
          new Array(LOADING_PLACEHOLDER_COUNT)
            .fill(0)
            .map((_, i) => <ProjectRow key={`skeleton-${i}`} isLoading />)}

        {!isLoading && (
          <AllProjectsTree
            allItems={listedItems}
            allProjects={allProjects}
            search={search}
            sortItems={sortItems}
            previewUrlById={previewUrlById}
            onClose={onClose}
          />
        )}
      </div>
    </ModalWithToolbar>
  );
};
