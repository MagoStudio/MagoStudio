import { filterVideoFiles } from "./getVideoDuration";

interface RouteVideoFilesParams {
  files: File[];
  projectId: string | undefined;
  onSingleFile: (file: File) => void;
  onBulkUpload: (files: File[], projectId: string) => void;
}

export const routeVideoFiles = ({
  files,
  projectId,
  onSingleFile,
  onBulkUpload
}: RouteVideoFilesParams): void => {
  const videoFiles = filterVideoFiles(files);
  if (videoFiles.length === 0) return;
  if (videoFiles.length === 1) {
    onSingleFile(videoFiles[0]);
    return;
  }
  if (projectId) {
    onBulkUpload(videoFiles, projectId);
  }
};
