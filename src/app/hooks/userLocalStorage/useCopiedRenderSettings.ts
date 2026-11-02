import { UserLocalStorage } from "../constants";

import { useUserLocalStorage } from "./useUserLocalStorage";

const copiedRenderSettingsAndEngineKey = "copiedRenderSettingsAndEngine";

export const useCopiedRenderSettings = () => {
  const [copiedRenderSettings, setCopiedRenderSettings] = useUserLocalStorage<
    UserLocalStorage[typeof copiedRenderSettingsAndEngineKey]
  >(copiedRenderSettingsAndEngineKey, undefined);

  return { copiedRenderSettings, setCopiedRenderSettings };
};
