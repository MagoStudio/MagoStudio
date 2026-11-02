"use client";

/* oxlint-disable custom-react/no-use-effect -- subscribing to external state */
import { useEffect, useState } from "react";

import {
  PROVIDER_PREFERENCES_EVENT,
  ProviderPreferences,
  readProviderPreferences,
  STORAGE_KEY
} from "./providerPreferences";

/**
 * The provider switches, kept current.
 *
 * Listens for the in-page event the settings modal fires, so the model list
 * updates as the user flips a switch rather than on the next reload, and for the
 * storage event so a second window stays in step.
 */
export const useProviderPreferences = (): ProviderPreferences => {
  const [preferences, setPreferences] = useState<ProviderPreferences>(
    readProviderPreferences
  );

  useEffect(() => {
    const refresh = () => setPreferences(readProviderPreferences());
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === STORAGE_KEY) refresh();
    };
    window.addEventListener(PROVIDER_PREFERENCES_EVENT, refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(PROVIDER_PREFERENCES_EVENT, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return preferences;
};
