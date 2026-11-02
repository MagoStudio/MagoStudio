import { SourceImage } from "@domains/renders/types";

const SLOT_ROLES = new Set<SourceImage["type"]>([
  "reference_frame",
  "motion_reference"
]);

export const promoteReferenceFrameToMotionReference = (
  sources: SourceImage[]
): SourceImage[] => {
  const slotEntries = sources.filter((entry) => SLOT_ROLES.has(entry.type));
  if (slotEntries.length !== 1) return sources;
  const [slotEntry] = slotEntries;
  if (slotEntry.type !== "reference_frame") return sources;
  return sources.map((entry) =>
    entry === slotEntry
      ? { asset_id: entry.asset_id, type: "motion_reference" }
      : entry
  );
};
