import { useCreateNewProject } from "@domains/project/useCreateNewProject";
import { useCreateScriptProject } from "@domains/scriptProject/useCreateScriptProject";
import { useNewVideoProjectModal } from "@home/components/dashboard/ProjectModal/useNewVideoProjectModal";
import { ProjectType } from "@schemas/scriptProject";
import { useState } from "react";

export const useCreateProjectOfType = (projectType: ProjectType) => {
  const { createNewProject } = useCreateNewProject();
  const { createScriptProject, isCreatingScriptProject } =
    useCreateScriptProject();
  const { openNewVideoProjectModal, newVideoProjectModal } =
    useNewVideoProjectModal();
  const [isCreatingVideoProject, setIsCreatingVideoProject] = useState(false);

  const createVideoProject = async () => {
    setIsCreatingVideoProject(true);
    try {
      const newProject = await createNewProject();
      if (newProject) openNewVideoProjectModal(newProject);
    } finally {
      setIsCreatingVideoProject(false);
    }
  };

  const createProjectOfTypeOrThrow = () => {
    if (projectType === "script_to_shots") return createScriptProject();
    return createVideoProject();
  };

  const createProjectOfType = () =>
    createProjectOfTypeOrThrow().catch(() => undefined);

  return {
    createProjectOfType,
    isCreatingProjectOfType: isCreatingVideoProject || isCreatingScriptProject,
    newVideoProjectModal
  };
};
