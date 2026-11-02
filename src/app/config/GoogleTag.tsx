"use client";

import { useMountEffect } from "@hooks/useMountEffect";
/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect for external sync */
import { useUser } from "@platform/identity";
import { useEffect, useRef } from "react";
import ReactGA from "react-ga4";

import { enrichUnsafeMetadata } from "./utils/enrichUnsafeMetadata";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const GOOGLE_TAG_ID = process.env.NEXT_PUBLIC_GOOGLE_TAG_ID;
const CLIENT_ID_RETRY_DELAY_MS = 300;
const MAX_CLIENT_ID_ATTEMPTS = 10;
const GA_CLIENT_ID_STORAGE_KEY = "google_analytics_client_id_pending";

export function GoogleTag(): React.ReactNode {
  const { user, isLoaded } = useUser();
  const hasInitialized = useRef(false);
  const hasLoggedClientId = useRef(false);
  const clientIdAttempts = useRef(0);
  const hasSavedClientId = useRef(false);

  useMountEffect(() => {
    if (!GOOGLE_TAG_ID || hasInitialized.current) {
      return;
    }

    ReactGA.initialize(GOOGLE_TAG_ID);
    hasInitialized.current = true;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !isLoaded || !user) {
      return;
    }

    const existingClientId = user.unsafeMetadata?.google_analytics_user_id as
      | string
      | undefined;

    if (existingClientId && existingClientId !== "") {
      localStorage.removeItem(GA_CLIENT_ID_STORAGE_KEY);
      hasSavedClientId.current = true;
      return;
    }

    const pendingClientId = localStorage.getItem(GA_CLIENT_ID_STORAGE_KEY);

    if (!pendingClientId || pendingClientId.trim() === "") {
      return;
    }

    enrichUnsafeMetadata(user, { google_analytics_user_id: pendingClientId })
      .then(() => {
        localStorage.removeItem(GA_CLIENT_ID_STORAGE_KEY);
        hasSavedClientId.current = true;
      })
      .catch((error) => {
        console.error(
          "Failed to update google_analytics_user_id in unsafeMetadata:",
          error
        );
      });
  }, [isLoaded, user]);

  useEffect(() => {
    if (
      !GOOGLE_TAG_ID ||
      !hasInitialized.current ||
      hasLoggedClientId.current
    ) {
      return;
    }

    const tryGetClientId = () => {
      if (typeof window.gtag !== "function") {
        clientIdAttempts.current += 1;
        if (clientIdAttempts.current < MAX_CLIENT_ID_ATTEMPTS) {
          setTimeout(tryGetClientId, CLIENT_ID_RETRY_DELAY_MS);
        }
        return;
      }

      ReactGA.gtag("get", GOOGLE_TAG_ID, "client_id", (clientId: string) => {
        if (!clientId || clientId.trim() === "" || hasSavedClientId.current) {
          return;
        }

        if (isLoaded && user) {
          enrichUnsafeMetadata(user, { google_analytics_user_id: clientId })
            .then(() => {
              localStorage.removeItem(GA_CLIENT_ID_STORAGE_KEY);
              hasSavedClientId.current = true;
            })
            .catch((error) => {
              console.error(
                "Failed to update google_analytics_user_id in unsafeMetadata:",
                error
              );
            });
        } else if (typeof window !== "undefined") {
          localStorage.setItem(GA_CLIENT_ID_STORAGE_KEY, clientId);
        }
      });
      hasLoggedClientId.current = true;
    };

    tryGetClientId();
  }, [isLoaded, user]);

  return null;
}
