import { roundSceneShotSeconds } from "./roundSceneShotSeconds";

export const formatSceneShotSeconds = (seconds: number): string =>
  String(roundSceneShotSeconds(seconds));
