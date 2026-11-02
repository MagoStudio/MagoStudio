export const OFFLINE_LOCAL_USER_ID = "local";

export const LOCAL_FOLDER_DUMMY_PROJECT_DESCRIPTION = "Folder dummy project";

export const isLocalFolderDummyProject = (project: {
  name: string;
  description?: string | null;
}): boolean =>
  project.name === OFFLINE_LOCAL_USER_ID &&
  project.description === LOCAL_FOLDER_DUMMY_PROJECT_DESCRIPTION;
