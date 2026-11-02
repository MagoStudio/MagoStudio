import { useUserLocalStorage } from "./useUserLocalStorage";

export const useCreditsAlert = () => {
  const [creditsAlertDismissedTime, setCreditsAlertDismissedTime] =
    useUserLocalStorage<number | null>("creditsAlertDismissedTime", null);

  return { creditsAlertDismissedTime, setCreditsAlertDismissedTime };
};
