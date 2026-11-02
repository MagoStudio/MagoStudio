import { Balance } from "@schemas/balance";

import { isOnboardingCompleted } from "./isOnboardingCompleted";

const videoRendersInProgress = (balance: Balance): number =>
  balance.renders_in_progress.credits.video +
  balance.renders_in_progress.unlimited.video;

export const needsOnboardingFromBalance = (balance: Balance): boolean =>
  !isOnboardingCompleted(balance.onboarding) &&
  videoRendersInProgress(balance) === 0;
