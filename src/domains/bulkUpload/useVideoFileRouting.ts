import { useProject } from "@domains/project/useProject";
import { addVideoRequestAtom } from "@store/atoms";
import { useSetAtom } from "jotai";

import { filterVideoFiles } from "./utils/getVideoDuration";
import { routeVideoFiles } from "./utils/routeVideoFiles";

/** Decides what happens to videos a user adds to a project.
 *
 * A cloud project follows the cloud app's flow: one video opens the trim modal
 * and uploads to cloud Mago, several go through the bulk uploader. A local
 * project imports straight into the library. */
export const useVideoFileRouting = (
  projectId: string | undefined,
  startBulkUpload: (
    files: File[],
    projectId: string,
    targetFolderId: string
  ) => unknown
) => {
  const { data: project } = useProject(projectId);
  const setAddVideoRequest = useSetAtom(addVideoRequestAtom);

  return (files: File[], targetFolderId = "") => {
    const isLocalImport =
      typeof window !== "undefined" &&
      !!window.mago &&
      project?.origin !== "cloud";
    if (isLocalImport) {
      const videos = filterVideoFiles(files);
      if (projectId && videos.length > 0) {
        void startBulkUpload(videos, projectId, targetFolderId);
      }
      return;
    }
    routeVideoFiles({
      files,
      projectId,
      onSingleFile: (file) =>
        setAddVideoRequest({ file, existingProjectId: projectId }),
      onBulkUpload: (videoFiles, pid) =>
        void startBulkUpload(videoFiles, pid, targetFolderId)
    });
  };
};
