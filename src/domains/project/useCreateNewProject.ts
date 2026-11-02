import { useCreateProjectFoldersProject } from "@hooks/projectFolders/useCreateProjectFoldersProject";
import { trackingUtils } from "@hooks/tracking/trackingUtils";
import { getDefaultRenderFrames } from "@models/video/types";
import { ProjectType } from "@schemas/scriptProject";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";

import { ProjectCreationTarget } from "./projectCreationTarget";
import { useCreateProject } from "./useCreateProject";
import { useProjects } from "./useProjects";
import { generateUntitledName } from "./utils/generateUntitledName";

const DEFAULT_FPS = 24;
const DEFAULT_START_FRAME = 0;

export const useCreateNewProject = () => {
  const { t } = useTranslation();
  const { data: allProjects } = useProjects();
  const { mutateAsync: createProject } = useCreateProject();
  const { mutateAsync: createProjectFoldersProject } =
    useCreateProjectFoldersProject();
  const { selectedModelAtom } = useRenderSettingsAtoms();
  const selectedModel = useAtomValue(selectedModelAtom);
  const createNewProject = async ({
    parentFolderId,
    projectType,
    creationTarget
  }: {
    parentFolderId?: string;
    projectType?: ProjectType;
    creationTarget?: ProjectCreationTarget;
  } = {}) => {
    const projectName = generateUntitledName(
      allProjects?.map((p) => p.name) ?? [],
      t("titles.untitled_project.label")
    );

    const newProject = await createProject({
      projectName,
      projectDescription: "",
      projectType,
      creationTarget,
      rangeMin: DEFAULT_START_FRAME,
      rangeMax: getDefaultRenderFrames(
        selectedModel.renderDurationLimits.defaultFrameRange,
        DEFAULT_FPS
      )
    });

    if (!newProject) return undefined;

    trackingUtils.projectActions.create(newProject.id, newProject.name);

    await createProjectFoldersProject({
      projectId: newProject.id,
      projectName: newProject.name,
      parentFolderId
    });

    return newProject;
  };
  return {
    createNewProject
  };
};
