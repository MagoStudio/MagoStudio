import { ONBOARDING_PROJECT_NAME } from "../constants";

const ONBOARDING_NAME_PATTERN = new RegExp(
  `^${ONBOARDING_PROJECT_NAME}(_\\d+)?$`
);

export const isOnboardingProjectName = (name: string): boolean =>
  ONBOARDING_NAME_PATTERN.test(name);

export const buildOnboardingProjectName = (existingNames: string[]): string => {
  const taken = new Set(existingNames);
  if (!taken.has(ONBOARDING_PROJECT_NAME)) return ONBOARDING_PROJECT_NAME;

  let suffix = 1;
  while (taken.has(`${ONBOARDING_PROJECT_NAME}_${suffix}`)) suffix++;
  return `${ONBOARDING_PROJECT_NAME}_${suffix}`;
};
