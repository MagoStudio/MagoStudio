import { UserLocalStorageProjectSettings } from "../constants";

import { useUserLocalStorage } from "./useUserLocalStorage";

const projectSettingsKey = "projectSettings";

export const useLocalStorageProjectSettings = (
  projectId: string | undefined,
  shotId: string | undefined
) => {
  const [projectSettingsInLocalStorage, setProjectSettingsInLocalStorage] =
    useUserLocalStorage<UserLocalStorageProjectSettings>(
      projectSettingsKey,
      {},
      { level: "shot", projectId, shotId }
    );
  const projectSettings = projectSettingsInLocalStorage;
  const setProjectSettings = (settings: UserLocalStorageProjectSettings) => {
    setProjectSettingsInLocalStorage(settings);
  };
  return {
    projectSettings,
    setProjectSettings
  };
};
