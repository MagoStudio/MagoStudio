import { useDeleteProject } from "@domains/project/useDeleteProject";
import { Project } from "@schemas/project";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { queryKeys } from "@/queryKeys";

import { ProjectModal } from "./ProjectModal";

export const useNewVideoProjectModal = () => {
  const [newVideoProjectId, setNewVideoProjectId] = useState<string | null>(
    null
  );
  const queryClient = useQueryClient();
  const { mutate: deleteProject } = useDeleteProject();

  const closeNewVideoProjectModal = () => {
    if (newVideoProjectId) {
      const project = queryClient.getQueryData<Project>(
        queryKeys.project.byId(newVideoProjectId)
      );
      const hasContent =
        !project ||
        project.timelines?.some((timeline) => timeline.layers.length > 0);
      if (!hasContent) {
        void queryClient.cancelQueries({ queryKey: queryKeys.projectList.all });
        deleteProject({ projectId: newVideoProjectId });
      }
    }
    setNewVideoProjectId(null);
  };

  return {
    openNewVideoProjectModal: (newProject: Project) =>
      setNewVideoProjectId(newProject.id),
    newVideoProjectModal: (
      <ProjectModal
        open={!!newVideoProjectId}
        onClose={closeNewVideoProjectModal}
        projectId={newVideoProjectId ?? undefined}
      />
    )
  };
};
