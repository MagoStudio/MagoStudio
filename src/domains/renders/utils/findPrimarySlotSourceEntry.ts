import { SourceImage, SourceImageType } from "@domains/renders/types";

export const findPrimarySlotSourceEntry = (
  sources: SourceImage[],
  declaredRoles: SourceImageType[]
): SourceImage | undefined => {
  for (const role of declaredRoles) {
    const matchingEntry = sources.find((entry) => entry.type === role);
    if (matchingEntry) return matchingEntry;
  }
  return undefined;
};
