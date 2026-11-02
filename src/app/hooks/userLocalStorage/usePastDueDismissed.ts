import { UserLocalStorage, defaultUserLocalStorage } from "../constants";

import { useUserLocalStorage } from "./useUserLocalStorage";

const pastDueDismissedKey = "pastDueDismissed";

export const usePastDueDismissed = () => {
  const [pastDueDismissed, setPastDueDismissed] = useUserLocalStorage<
    UserLocalStorage[typeof pastDueDismissedKey]
  >(pastDueDismissedKey, defaultUserLocalStorage.pastDueDismissed);

  return { pastDueDismissed, setPastDueDismissed };
};
