import { useOpenLocalSetupWizard } from "@app/components/LocalSetupWizard/hooks/useOpenLocalSetupWizard";
import { useCreateNewProject } from "@domains/project/useCreateNewProject";
import { useCreateScriptProject } from "@domains/scriptProject/useCreateScriptProject";
import { useNewVideoProjectModal } from "@home/components/dashboard/ProjectModal/useNewVideoProjectModal";
import { createProjectDestinationRequestAtom } from "@store/atoms/createProjectDestinationRequestAtom";
import { useToast } from "@store/useToast";
import { useAtom } from "jotai";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { ProjectCreationTarget } from "@/domains/project/projectCreationTarget";

import { CreateProjectDestinationDialog } from "./CreateProjectDestinationDialog";
import { useProjectCreationReadiness } from "./hooks/useProjectCreationReadiness";

export const CreateProjectDestinationDialogHost: React.FC = () => {
  const { t } = useTranslation();
  const { showErrorToast } = useToast();
  const [requestedProjectType, setRequestedProjectType] = useAtom(
    createProjectDestinationRequestAtom
  );
  const { isLocalProjectCreationReady, isCloudProjectCreationReady } =
    useProjectCreationReadiness();
  const { createNewProject } = useCreateNewProject();
  const { createScriptProject, isCreatingScriptProject } =
    useCreateScriptProject();
  const { openNewVideoProjectModal, newVideoProjectModal } =
    useNewVideoProjectModal();
  const openLocalSetupWizard = useOpenLocalSetupWizard();
  const [isCreatingVideoProject, setIsCreatingVideoProject] = useState(false);

  const closeDialog = () => setRequestedProjectType(null);

  const createVideoProject = async (creationTarget: ProjectCreationTarget) => {
    setIsCreatingVideoProject(true);
    try {
      const newProject = await createNewProject({ creationTarget });
      closeDialog();
      if (newProject) openNewVideoProjectModal(newProject);
    } finally {
      setIsCreatingVideoProject(false);
    }
  };

  const createProjectOfRequestedType = (
    creationTarget: ProjectCreationTarget
  ) => {
    if (requestedProjectType === "script_to_shots") {
      void createScriptProject(creationTarget)
        .then(closeDialog)
        .catch(() => undefined);
      return;
    }
    void createVideoProject(creationTarget).catch(() => undefined);
  };

  return (
    <>
      {requestedProjectType && (
        <CreateProjectDestinationDialog
          projectType={requestedProjectType}
          isOpen
          onOpenChange={(isOpen) => {
            if (!isOpen) closeDialog();
          }}
          isLocalProjectCreationReady={isLocalProjectCreationReady}
          isCloudProjectCreationReady={isCloudProjectCreationReady}
          isCreatingProject={isCreatingVideoProject || isCreatingScriptProject}
          onCreateProject={createProjectOfRequestedType}
          onSetUpLocalRendering={() => {
            closeDialog();
            openLocalSetupWizard();
          }}
          onSignInToCloud={() => {
            closeDialog();
            void window.mago.account.signOut().catch(() => {
              showErrorToast({
                message: t("notifications.cloud_sign_in_failed.description")
              });
            });
          }}
        />
      )}
      {newVideoProjectModal}
    </>
  );
};
