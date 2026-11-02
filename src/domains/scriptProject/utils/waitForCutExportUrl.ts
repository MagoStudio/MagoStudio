import { getProjectCut } from "../api/getProjectCut";

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 100;

/** The exported MP4's URL, once the worker has uploaded it.
 *
 * The stitch runs in the agent worker, so the dispatch returns before the file exists. Polls
 * the cut rather than the plan, because the URL is what the download needs and it appears on
 * the cut the moment the upload lands. Returns null if it never does, which sends the caller
 * to the per-shot fallback rather than leaving the button spinning. */
export const waitForCutExportUrl = async ({
  projectId,
  planId,
  sleep = (durationMs: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, durationMs))
}: {
  projectId: string;
  planId: string;
  sleep?: (durationMs: number) => Promise<void>;
}): Promise<string | null> => {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
    await sleep(POLL_INTERVAL_MS);

    const cut = await getProjectCut(projectId);
    const isThisExport = cut.export?.plan_id === planId;

    if (isThisExport && cut.export?.url) return cut.export.url;
  }

  return null;
};
