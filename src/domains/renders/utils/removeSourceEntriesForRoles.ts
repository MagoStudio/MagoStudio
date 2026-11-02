import { SourceImage, SourceImageType } from "@domains/renders/types";

export const removeSourceEntriesForRoles = (
  sources: SourceImage[],
  roles: SourceImageType[]
): SourceImage[] => sources.filter((entry) => !roles.includes(entry.type));
