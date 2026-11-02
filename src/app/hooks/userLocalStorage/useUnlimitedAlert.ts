import { UserLocalStorage, defaultUserLocalStorage } from "../constants";

import { useUserLocalStorage } from "./useUserLocalStorage";

const unlimitedAlertDismissedTimeKey = "unlimitedAlertDismissedTime";

export const useUnlimitedAlert = () => {
  const [unlimitedAlertDismissedTime, setUnlimitedAlertDismissedTime] =
    useUserLocalStorage<
      UserLocalStorage[typeof unlimitedAlertDismissedTimeKey]
    >(
      unlimitedAlertDismissedTimeKey,
      defaultUserLocalStorage.unlimitedAlertDismissedTime
    );

  return { unlimitedAlertDismissedTime, setUnlimitedAlertDismissedTime };
};
