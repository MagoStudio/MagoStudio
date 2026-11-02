import { useCreateNewProject } from "@domains/project/useCreateNewProject";
import { useCreateScriptProject } from "@domains/scriptProject/useCreateScriptProject";
import { Project } from "@schemas/project";
import { useState } from "react";

import { ProjectCreationTarget } from "@/domains/project/projectCreationTarget";

import { useProjectCreationReadiness } from "../CreateProjectDestinationDialog/hooks/useProjectCreationReadiness";

import { CreateProjectTypeDialog } from "./CreateProjectTypeDialog";

export const useCreateProjectTypeDialog = ({
  onVideoProjectCreated
}: {
  onVideoProjectCreated: (project: Project) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { createNewProject } = useCreateNewProject();
  const { createScriptProject, isCreatingScriptProject } =
    useCreateScriptProject();
  const { isLocalProjectCreationReady, isCloudProjectCreationReady } =
    useProjectCreationReadiness();
  const availability = {
    local: isLocalProjectCreationReady,
    cloud: isCloudProjectCreationReady
  };
  const isChecking = false;
  const [selectedCreationTarget, setSelectedCreationTarget] =
    useState<ProjectCreationTarget>("local");
  const creationTarget = availability[selectedCreationTarget]
    ? selectedCreationTarget
    : !isChecking && availability.local
      ? "local"
      : !isChecking && availability.cloud
        ? "cloud"
        : selectedCreationTarget;

  const handleChooseVideo = async () => {
    setIsOpen(false);
    const newProject = await createNewProject({ creationTarget });
    if (newProject) onVideoProjectCreated(newProject);
  };

  const handleChooseScenario = async () => {
    await createScriptProject(creationTarget);
    setIsOpen(false);
  };

  return {
    open: () => setIsOpen(true),
    dialog: (
      <CreateProjectTypeDialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        onChooseScenario={handleChooseScenario}
        onChooseVideo={handleChooseVideo}
        isCreatingProject={isCreatingScriptProject}
        creationTarget={creationTarget}
        creationAvailability={availability}
        isCheckingCreationAvailability={isChecking}
        onCreationTargetChange={setSelectedCreationTarget}
      />
    )
  };
};
