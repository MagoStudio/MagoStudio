import { UserLocalStorage } from "../constants";

import { useUserLocalStorage } from "./useUserLocalStorage";

const mobileWarningDismissedKey = "mobileWarningDismissed";

export const useMobileWarning = () => {
  const [mobileWarningDismissed, setMobileWarningDismissed] =
    useUserLocalStorage<UserLocalStorage[typeof mobileWarningDismissedKey]>(
      mobileWarningDismissedKey,
      false
    );

  return { mobileWarningDismissed, setMobileWarningDismissed };
};
