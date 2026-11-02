"use client";

/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect for external sync */
import * as amplitude from "@amplitude/analytics-browser";
import { useUser } from "@platform/identity";
import { useEffect } from "react";

export const AmplitudeUserTracking = (): null => {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded || !user) {
      return;
    }

    const email = user.primaryEmailAddress?.emailAddress;
    const userId = user.id;

    if (!userId || !email) {
      console.error("Amplitude: User is not fully identified", {
        userId,
        email,
        fullName: user.fullName,
        company: email?.endsWith("@mago.studio") ? "Mago" : "Other"
      });
      return;
    }

    amplitude.setUserId(userId);

    const identifyEvent = new amplitude.Identify();
    identifyEvent.set("email", email);
    identifyEvent.set("fullName", user.fullName || "");
    identifyEvent.set(
      "company",
      email.endsWith("@mago.studio") ? "Mago" : "Other"
    );

    amplitude.identify(identifyEvent);
  }, [isLoaded, user]);

  return null;
};
