import { MILLISECONDS_TO_SECONDS } from "@domains/payment/constants";

const TICK_INTERVAL_MS = 60_000;

const readClock = () => Math.floor(Date.now() / MILLISECONDS_TO_SECONDS);

let currentTimeInSeconds = readClock();
const listeners = new Set<() => void>();
let tickIntervalId: ReturnType<typeof setInterval> | undefined;

const tick = () => {
  currentTimeInSeconds = readClock();
  for (const listener of listeners) listener();
};

export const currentTimeStore = {
  subscribe: (listener: () => void) => {
    currentTimeInSeconds = readClock();
    listeners.add(listener);
    tickIntervalId ??= setInterval(tick, TICK_INTERVAL_MS);

    return () => {
      listeners.delete(listener);
      if (listeners.size > 0 || tickIntervalId === undefined) return;
      clearInterval(tickIntervalId);
      tickIntervalId = undefined;
    };
  },
  getSnapshot: () => currentTimeInSeconds,
  getServerSnapshot: () => currentTimeInSeconds
};
