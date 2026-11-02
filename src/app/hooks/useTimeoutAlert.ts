/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect for external sync */

import { shouldShowDismissedAlert } from "@utils";
import { useState, useEffect } from "react";

import { useCreditsAlert } from "./userLocalStorage/useCreditsAlert";
import { useUnlimitedAlert } from "./userLocalStorage/useUnlimitedAlert";

interface UseTimeoutAlertOptions {
  alertKey: "creditsAlertDismissedTime" | "unlimitedAlertDismissedTime";
  timeoutMs: number;
  shouldShowCondition: boolean;
}

export const useTimeoutAlert = ({
  alertKey,
  timeoutMs,
  shouldShowCondition
}: UseTimeoutAlertOptions) => {
  const { creditsAlertDismissedTime } = useCreditsAlert();
  const { unlimitedAlertDismissedTime } = useUnlimitedAlert();

  const dismissedTime =
    alertKey === "creditsAlertDismissedTime"
      ? creditsAlertDismissedTime
      : (unlimitedAlertDismissedTime ?? null);

  const shouldShow =
    shouldShowCondition && shouldShowDismissedAlert(dismissedTime, timeoutMs);

  const [shouldShowAlert, setShouldShowAlert] = useState(shouldShow);

  if (shouldShow !== shouldShowAlert) {
    setShouldShowAlert(shouldShow);
  }

  useEffect(() => {
    if (!dismissedTime || shouldShowDismissedAlert(dismissedTime, timeoutMs)) {
      return;
    }
    const timeUntilExpiry = timeoutMs - (Date.now() - dismissedTime);
    if (timeUntilExpiry <= 0) {
      return;
    }
    const timer = setTimeout(() => {
      setShouldShowAlert(shouldShowCondition);
    }, timeUntilExpiry);
    return () => clearTimeout(timer);
  }, [shouldShowCondition, dismissedTime, timeoutMs]);

  return shouldShowAlert;
};
