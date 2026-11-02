import { useState } from "react";
import { useInterval } from "usehooks-ts";

const TICK_INTERVAL_MS = 1000;

export const useCurrentTimeMs = (isTicking: boolean) => {
  const [currentTimeMs, setCurrentTimeMs] = useState(Date.now);
  useInterval(
    () => setCurrentTimeMs(Date.now()),
    isTicking ? TICK_INTERVAL_MS : null
  );
  return currentTimeMs;
};
