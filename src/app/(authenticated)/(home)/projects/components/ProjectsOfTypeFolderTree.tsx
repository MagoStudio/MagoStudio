import { MainButton } from "@components/MainButton";
import { AddProjectFolderButton } from "@home/components/dashboard/AllProjectsModal/AddProjectFolderButton";
import { AllProjectsTree } from "@home/components/dashboard/AllProjectsModal/AllProjectsTree";
import { useAllProjectsTreeState } from "@home/components/dashboard/AllProjectsModal/hooks/useAllProjectsTreeState";
import { ProjectRow } from "@home/components/dashboard/ProjectRow";
import { ShotsToolbar } from "@home/components/dashboard/shared/ShotsToolbar";
import { keepFolderTreeProjectsOfType } from "@hooks/projectFolders/utils/keepFolderTreeProjectsOfType";
import { ProjectType } from "@schemas/scriptProject";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useCreateProjectOfType } from "../hooks/useCreateProjectOfType";

import { ProjectTypeHeading } from "./ProjectTypeHeading";

const LOADING_PLACEHOLDER_COUNT = 8;

type Props = {
  projectType: ProjectType;
};

export const ProjectsOfTypeFolderTree: React.FC<Props> = ({ projectType }) => {
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

  const { createProjectOfType, isCreatingProjectOfType, newVideoProjectModal } =
    useCreateProjectOfType(projectType);

  const folderTreeItemsOfType = useMemo(
    () =>
      keepFolderTreeProjectsOfType({
        folderTreeItems: allItems,
        projects: allProjects ?? [],
        projectType
      }),
    [allItems, allProjects, projectType]
  );

  return (
    <>
      {newVideoProjectModal}
      <ProjectTypeHeading projectType={projectType} />
      <ShotsToolbar
        search={search}
        onSearchChange={setSearch}
        sortOptions={sortOptions}
        selectedSortKey={selectedSortKey}
        onSortChange={handleSortChange}
        sortDirection={sortDirection}
        onToggleSortDirection={toggleSortDirection}
        primaryAction={
          <MainButton
            onPress={() => createProjectOfType()}
            isDisabled={isCreatingProjectOfType}
          >
            {t("actions.create_project.label")}
          </MainButton>
        }
        secondaryActions={
          <AddProjectFolderButton onPress={() => void createFolder()} />
        }
      />
      <div className="flex flex-col" data-testid="projects-of-type-folder-tree">
        {isLoading &&
          new Array(LOADING_PLACEHOLDER_COUNT)
            .fill(0)
            .map((_, index) => (
              <ProjectRow key={`skeleton-${index}`} isLoading />
            ))}

        {!isLoading && (
          <AllProjectsTree
            allItems={folderTreeItemsOfType}
            allProjects={allProjects}
            search={search}
            sortItems={sortItems}
            previewUrlById={previewUrlById}
            onClose={() => undefined}
          />
        )}
      </div>
    </>
  );
};
