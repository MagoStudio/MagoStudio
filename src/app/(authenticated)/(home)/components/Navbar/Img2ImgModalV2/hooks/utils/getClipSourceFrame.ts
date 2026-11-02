import { Clip } from "@schemas/clip";

export const getClipSourceFrame = (
  clipData: Clip["data"] | undefined
): number | undefined => clipData?.settings?.frame ?? clipData?.frame;
