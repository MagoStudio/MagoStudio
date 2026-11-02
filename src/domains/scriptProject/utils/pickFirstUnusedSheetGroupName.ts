import { normaliseSheetToken } from "./normaliseSheetToken";

const FIRST_NUMBERED_SUFFIX = 2;

export const pickFirstUnusedSheetGroupName = (
  baseName: string,
  existingTokens: string[]
): string => {
  const isNameUnused = (candidateName: string) => {
    const candidateToken = normaliseSheetToken(candidateName);
    return !candidateToken || !existingTokens.includes(candidateToken);
  };
  if (isNameUnused(baseName)) return baseName;
  let suffix = FIRST_NUMBERED_SUFFIX;
  while (!isNameUnused(`${baseName} ${suffix}`)) suffix += 1;
  return `${baseName} ${suffix}`;
};
