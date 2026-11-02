import { useLocalStorage } from "usehooks-ts";

export const LOCAL_SETUP_DEBUG_ENABLED_KEY =
  "mago_dev_local_setup_debug_enabled";

export const useLocalSetupDebugSetting = () =>
  useLocalStorage<boolean>(LOCAL_SETUP_DEBUG_ENABLED_KEY, false);
