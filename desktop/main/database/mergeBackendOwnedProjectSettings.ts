const BACKEND_OWNED_PROJECT_SETTINGS_KEYS = [
  "type",
  "script_flow",
  "pinnedTrackIds",
  "mirroredLocalProjectId",
  "visual_style"
] as const;

const PROJECT_SETTINGS_KEYS_NEVER_TAKEN_FROM_CLIENT = new Set<string>([
  "script_flow"
]);

const SCRIPT_PROJECT_TYPE = "script_to_shots";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

export const mergeBackendOwnedProjectSettings = ({
  storedSettings,
  incomingSettings
}: {
  storedSettings: Record<string, unknown>;
  incomingSettings: Record<string, unknown>;
}): Record<string, unknown> => {
  const mergedSettings: Record<string, unknown> = { ...incomingSettings };
  for (const key of BACKEND_OWNED_PROJECT_SETTINGS_KEYS) {
    const isStoredValuePresent = key in storedSettings;
    if (PROJECT_SETTINGS_KEYS_NEVER_TAKEN_FROM_CLIENT.has(key)) {
      if (isStoredValuePresent) mergedSettings[key] = storedSettings[key];
      else delete mergedSettings[key];
    } else if (!(key in mergedSettings) && isStoredValuePresent) {
      mergedSettings[key] = storedSettings[key];
    }
  }
  if (storedSettings.type === SCRIPT_PROJECT_TYPE)
    mergedSettings.type = SCRIPT_PROJECT_TYPE;
  return {
    ...mergedSettings,
    origin: storedSettings.origin === "cloud" ? "cloud" : "local",
    ...(isRecord(storedSettings.cloudSummary)
      ? { cloudSummary: storedSettings.cloudSummary }
      : {})
  };
};
