import { Text } from "@components/Text";
import { useProjectList } from "@domains/project/useProjectList";
import { buildProjectHrefForType } from "@domains/scriptProject/utils/buildProjectHrefForType";
import { AllProjectsModal } from "@home/components/dashboard/AllProjectsModal";
import { CreateProjectCardButton } from "@home/components/dashboard/CreateProjectCardButton";
import { ProjectCard } from "@home/components/dashboard/ProjectCard";
import { ProjectListCardButton } from "@home/components/dashboard/ProjectListCardButton";
import { ProjectType } from "@schemas/scriptProject";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button as AriaButton } from "react-aria-components/Button";
import { useTranslation } from "react-i18next";
import { useIntersectionObserver } from "usehooks-ts";

import { useCreateProjectOfType } from "../hooks/useCreateProjectOfType";
import { useLoadNextPageWhileSentinelVisible } from "../hooks/useLoadNextPageWhileSentinelVisible";

import { ProjectTypeHeading } from "./ProjectTypeHeading";

const SKELETON_COUNT = 8;

type Props = {
  projectType: ProjectType;
};

export const ProjectsOfTypeCardGrid: React.FC<Props> = ({ projectType }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const [isAllProjectsModalOpen, setIsAllProjectsModalOpen] = useState(false);

  const {
    allItems: projects,
    isLoading,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    fetchNextPage
  } = useProjectList({ projectType });

  const { createProjectOfType, isCreatingProjectOfType, newVideoProjectModal } =
    useCreateProjectOfType(projectType);

  const {
    ref: loadMoreSentinelRef,
    isIntersecting: isLoadMoreSentinelVisible
  } = useIntersectionObserver();
  useLoadNextPageWhileSentinelVisible({
    isLoadMoreSentinelVisible,
    hasNextPage,
    isFetchingAnyPage: isFetching,
    fetchNextPage
  });

  const hasNoProjectsOfType =
    !isLoading && !hasNextPage && projects.length === 0;

  return (
    <>
      {newVideoProjectModal}
      {isAllProjectsModalOpen && (
        <AllProjectsModal
          onClose={() => setIsAllProjectsModalOpen(false)}
          onCreateProject={() => createProjectOfType()}
          listedProjectType={projectType}
        />
      )}
      <div className="flex flex-row items-center justify-between">
        <ProjectTypeHeading projectType={projectType} />
        {!isLoading && (
          <AriaButton onPress={() => setIsAllProjectsModalOpen(true)}>
            <Text variant="md" color="glyph-primary-on-pic">
              {t("actions.all_projects.label")}
            </Text>
          </AriaButton>
        )}
      </div>
      {hasNoProjectsOfType && (
        <Text color="glyph-secondary" variant="md">
          {t("projects_by_type.empty_state.description")}
        </Text>
      )}
      <div className="w-full grid grid-cols-4 items-start gap-6">
        <CreateProjectCardButton
          onClick={() => createProjectOfType()}
          disabled={isCreatingProjectOfType}
          data-testid="projects-by-type-create-project"
        />
        {projects.map((project) => (
          <ProjectListCardButton
            key={project.id}
            project={project}
            onClick={() =>
              router.push(buildProjectHrefForType(project.id, project.type))
            }
          />
        ))}
        {(isLoading || isFetchingNextPage) &&
          new Array(SKELETON_COUNT)
            .fill(0)
            .map((_, index) => (
              <ProjectCard
                key={`project-card-skeleton-${index}`}
                isLoading={true}
              />
            ))}
      </div>
      <div ref={loadMoreSentinelRef} className="h-px w-full" />
    </>
  );
};
