import { SHOT_INDEX_PAD_LENGTH } from "../constants";

export const formatShotTitle = ({
  heading,
  shotIndex
}: {
  heading: string | null | undefined;
  shotIndex: number;
}): string =>
  heading?.trim() || String(shotIndex + 1).padStart(SHOT_INDEX_PAD_LENGTH, "0");
