import { useProject } from "@domains/project/useProject";
import { triggerBlobDownload } from "@hooks/files/utils";
import { CutShot } from "@schemas/scriptProject";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { queryKeys } from "@/queryKeys";

import { postProjectCutExport } from "./api/postProjectCutExport";
import { useProjectCutExportDryRun } from "./data/useProjectCutExportDryRun";
import { useDownloadCut } from "./useDownloadCut";
import { buildCutExportFileName } from "./utils/buildCutExportFileName";
import {
  CutExportRefusalDescription,
  describeCutExportRefusal
} from "./utils/describeCutExportRefusal";
import { waitForCutExportUrl } from "./utils/waitForCutExportUrl";

/** Download the cut as one MP4, offering the per-shot ZIP when it cannot be stitched.
 *
 * The stitch is a stream copy, so the backend refuses any cut whose pinned videos disagree on
 * size or fps — a partly-upscaled cut, which is an ordinary state rather than a fault. The dry
 * run reports that before the user presses anything; a failure that only appears mid-export
 * opens the dialog instead, because quietly handing back a different format than the button
 * promised is worse than asking. */
export const useExportCut = (
  projectId: string,
  cutShots: CutShot[],
  cutExportUrl: string | null | undefined
) => {
  const queryClient = useQueryClient();
  const { data: project } = useProject(projectId);
  const [isExportingCut, setIsExportingCut] = useState(false);
  const [failedExport, setFailedExport] =
    useState<CutExportRefusalDescription | null>(null);
  const {
    downloadCut: downloadCutAsZip,
    downloadOneShot,
    isDownloadingCut,
    downloadableShotCount
  } = useDownloadCut(cutShots, project?.name);

  const { data: exportDryRun } = useProjectCutExportDryRun(projectId);
  const expectedRefusal = describeCutExportRefusal(exportDryRun?.refused);

  const downloadStitchedFile = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Downloading the cut failed with ${response.status}`);
    }
    triggerBlobDownload(
      await response.blob(),
      buildCutExportFileName(project?.name, "mp4")
    );
  };

  const exportCut = async () => {
    if (downloadableShotCount === 0) return;
    setIsExportingCut(true);

    try {
      const dispatch = await postProjectCutExport({
        projectId,
        isDryRun: false
      });

      const refusal = describeCutExportRefusal(dispatch.refused);
      if (refusal) {
        setFailedExport(refusal);
        return;
      }

      if (dispatch.reused && cutExportUrl) {
        await downloadStitchedFile(cutExportUrl);
        return;
      }

      if (!dispatch.plan_id) {
        setFailedExport({
          labelKey: "script_project.export_unavailable.label",
          shotNumbers: []
        });
        return;
      }

      const stitchedUrl = await waitForCutExportUrl({
        projectId,
        planId: dispatch.plan_id
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.projectCut.byProjectId(projectId)
      });

      if (!stitchedUrl) {
        setFailedExport({
          labelKey: "script_project.export_timed_out.label",
          shotNumbers: []
        });
        return;
      }

      await downloadStitchedFile(stitchedUrl);
    } catch {
      setFailedExport({
        labelKey: "script_project.export_failed_reason.label",
        shotNumbers: []
      });
    } finally {
      setIsExportingCut(false);
    }
  };

  const isAnySceneInCutHiddenUntilDubLands = cutShots.some(
    (cutShot) => cutShot.isSceneHiddenUntilDubLands
  );

  /* A cut the dry run already refused is not asked to stitch: the answer is known, so the
   * button goes straight to the separate files rather than spending a request to be told no
   * and then opening a dialog about it. */
  const downloadCut = async () => {
    if (isAnySceneInCutHiddenUntilDubLands) return;
    await (expectedRefusal ? downloadCutAsZip() : exportCut());
  };

  return {
    downloadCut,
    downloadOneShot,
    downloadCutAsZipAndDismiss: async () => {
      if (isAnySceneInCutHiddenUntilDubLands) return;
      await downloadCutAsZip();
      setFailedExport(null);
    },
    isExportingCut: isExportingCut || isDownloadingCut,
    isDownloadingCut,
    downloadableShotCount,
    isAnySceneInCutHiddenUntilDubLands,
    /** Known from the dry run, before the user presses anything. */
    expectedRefusal,
    failedExport,
    dismissFailedExport: () => setFailedExport(null)
  };
};
