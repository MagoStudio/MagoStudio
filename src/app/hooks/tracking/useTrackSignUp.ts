/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect for external sync */

import * as amplitude from "@amplitude/analytics-browser";
import { trackingUtils } from "@hooks/tracking/trackingUtils";
import { useUserLocalStorage } from "@hooks/userLocalStorage/useUserLocalStorage";
import { useUser } from "@platform/identity";
import { setHasAccountCookie } from "@utils/hasAccountCookie";
import { useEffect } from "react";

const NEW_USER_THRESHOLD_MS = 300_000;

export function useTrackSignUp() {
  const { user, isLoaded } = useUser();
  const [isTracked, setIsTracked] = useUserLocalStorage("signUpTracked", false);

  useEffect(() => {
    setHasAccountCookie();

    if (!isLoaded) return;

    if (isTracked) return;

    const accountAgeMs = user?.createdAt
      ? Date.now() - new Date(user.createdAt).getTime()
      : Infinity;
    const isNewUser = accountAgeMs < NEW_USER_THRESHOLD_MS;

    if (isNewUser && user?.id) {
      trackingUtils.userActions.signUp(
        user.id,
        user.primaryEmailAddress?.emailAddress
      );
      setIsTracked(true);
      amplitude.flush();
    }
  }, [user, isLoaded, isTracked, setIsTracked]);

  return { isLoaded };
}
