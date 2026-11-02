const MAGO_STATE_URL = "https://mago-state-25qdhq4f4q-uc.a.run.app/state";
const UNRESPONSIVE_HOST_TIMEOUT_MS = 8000;

export type MagoState = {
  "release-ongoing": boolean;
  version: string;
};

export const fetchMagoState = async (): Promise<MagoState> => {
  const response = await fetch(MAGO_STATE_URL, {
    signal: AbortSignal.timeout(UNRESPONSIVE_HOST_TIMEOUT_MS)
  });
  if (!response.ok) {
    throw new Error("Failed to fetch Mago state");
  }

  return response.json();
};
