import { SourceImage, SourceImageType } from "@domains/renders/types";

const LEGACY_SLOT_ROLES = new Set<SourceImageType>([
  "reference_frame",
  "key_frame"
]);

export const promoteLegacySlotSourceToPrimaryRole = (
  sources: SourceImage[],
  primarySourceSlotRoles: SourceImageType[],
  supportedSourceRoles: Set<SourceImageType>,
  keyFrameIndex: number
): SourceImage[] => {
  if (primarySourceSlotRoles.length === 0) return sources;

  const isPrimarySlotAlreadyFilled = sources.some((entry) =>
    primarySourceSlotRoles.includes(entry.type)
  );
  if (isPrimarySlotAlreadyFilled) return sources;

  const strandedSlotEntries = sources.filter(
    (entry) =>
      LEGACY_SLOT_ROLES.has(entry.type) && !supportedSourceRoles.has(entry.type)
  );
  if (strandedSlotEntries.length !== 1) return sources;

  const [strandedSlotEntry] = strandedSlotEntries;
  const [primarySourceSlotRole] = primarySourceSlotRoles;
  const promotedEntry: SourceImage =
    primarySourceSlotRole === "key_frame"
      ? {
          asset_id: strandedSlotEntry.asset_id,
          type: "key_frame",
          index: keyFrameIndex
        }
      : { asset_id: strandedSlotEntry.asset_id, type: primarySourceSlotRole };

  return sources.map((entry) =>
    entry === strandedSlotEntry ? promotedEntry : entry
  );
};
