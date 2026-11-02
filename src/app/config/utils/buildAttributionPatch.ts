import { UtmMetadata } from "./normalizeUtm";

interface AttributionSession {
  id: string;
  latestActivity?: { country?: string };
}

export interface BuildAttributionPatchInput {
  pendingUtm: UtmMetadata | null;
  sessions: AttributionSession[];
  currentSessionId?: string;
  storedCountry?: string;
}

export const buildAttributionPatch = ({
  pendingUtm,
  sessions,
  currentSessionId,
  storedCountry
}: BuildAttributionPatchInput): Record<string, unknown> | null => {
  const patch: Record<string, unknown> = {};

  if (pendingUtm) {
    patch.utm = pendingUtm;
  }

  if (!storedCountry) {
    const currentSession =
      sessions.find((candidate) => candidate.id === currentSessionId) ??
      sessions[0];
    const sessionCountry = currentSession?.latestActivity?.country;
    if (sessionCountry) {
      patch.country = sessionCountry;
    }
  }

  if (Object.keys(patch).length === 0) {
    return null;
  }

  return patch;
};
