import { Project, ProjectSchema } from "@schemas/project";

import { getLocalDesktopApi } from "@/platform/localDesktop";

import { LOCAL_FOLDER_DUMMY_PROJECT_DESCRIPTION } from "../../../../desktop/shared/localFolderDummyProject";

const FOLDER_DUMMY_PROJECT_RANGE_MIN = 0;
const FOLDER_DUMMY_PROJECT_RANGE_MAX = 48;

let localFolderDummyProjectCreation: Promise<Project> | undefined;

export const createLocalFolderDummyProjectOnce = (
  userId: string
): Promise<Project> => {
  localFolderDummyProjectCreation ??= getLocalDesktopApi()
    .projects.create({
      name: userId,
      description: LOCAL_FOLDER_DUMMY_PROJECT_DESCRIPTION,
      settings: {
        rangeMin: FOLDER_DUMMY_PROJECT_RANGE_MIN,
        rangeMax: FOLDER_DUMMY_PROJECT_RANGE_MAX,
        folders: []
      }
    })
    .then((createdProject) => ProjectSchema.parse(createdProject))
    .catch((err: unknown) => {
      localFolderDummyProjectCreation = undefined;
      throw err;
    });
  return localFolderDummyProjectCreation;
};
