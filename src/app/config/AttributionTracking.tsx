import { useMountEffect } from "@hooks/useMountEffect";
/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect for external sync */
import { useSession, useUser } from "@platform/identity";
import { useEffect, useRef } from "react";

import { buildAttributionPatch } from "./utils/buildAttributionPatch";
import { buildUtmMetadata } from "./utils/buildUtmMetadata";
import { enrichUnsafeMetadata } from "./utils/enrichUnsafeMetadata";
import { readPendingUtm } from "./utils/readPendingUtm";

const UTM_STORAGE_KEY = "utm_pending";

export function AttributionTracking(): null {
  const { user, isLoaded } = useUser();
  const { session } = useSession();
  const hasFlushed = useRef(false);

  useMountEffect(() => {
    const utm = buildUtmMetadata(window.location.search);
    if (!utm) {
      return;
    }
    try {
      localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));
    } catch {
      return;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined" || !isLoaded || !user) {
      return;
    }

    if (hasFlushed.current) {
      return;
    }
    hasFlushed.current = true;

    const flush = async () => {
      const rawPendingUtm = localStorage.getItem(UTM_STORAGE_KEY);
      const pendingUtm = readPendingUtm(rawPendingUtm);
      if (rawPendingUtm && !pendingUtm) {
        localStorage.removeItem(UTM_STORAGE_KEY);
      }

      const storedCountry = user.unsafeMetadata?.country as string | undefined;
      const sessions = storedCountry ? [] : await user.getSessions();

      const patch = buildAttributionPatch({
        pendingUtm,
        sessions,
        currentSessionId: session?.id,
        storedCountry
      });

      if (!patch) {
        return;
      }

      await enrichUnsafeMetadata(user, patch);
      localStorage.removeItem(UTM_STORAGE_KEY);
    };

    flush().catch((error) => {
      hasFlushed.current = false;
      console.error("Failed to store attribution in unsafeMetadata:", error);
    });
  }, [isLoaded, user, session?.id]);

  return null;
}
