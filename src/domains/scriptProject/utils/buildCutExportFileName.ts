import { sanitizeDownloadFilename } from "@hooks/files/utils/sanitizeDownloadFilename";

const MAX_CUT_FILENAME_BYTES = 200;
const UNNAMED_PROJECT_FILENAME = "cut";

/** What the downloaded cut is called: the project's own name, made filesystem-safe.
 *
 * `cut.mp4` for every project meant a downloads folder of files nobody could tell apart, and
 * a second download silently becoming `cut (1).mp4`. */
export const buildCutExportFileName = (
  projectName: string | null | undefined,
  extension: "mp4" | "zip"
): string => {
  const safeProjectName = sanitizeDownloadFilename(projectName ?? "", {
    maxBytes: MAX_CUT_FILENAME_BYTES
  }).trim();

  return `${safeProjectName || UNNAMED_PROJECT_FILENAME}.${extension}`;
};
