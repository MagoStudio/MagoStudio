import { useBulkUpload } from "@domains/bulkUpload/useBulkUpload";
import { useVideoFileRouting } from "@domains/bulkUpload/useVideoFileRouting";
import { openVideoFilePicker } from "@domains/bulkUpload/utils/openVideoFilePicker";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";

export const useAddVideo = () => {
  const projectId = useSelectedProjectId();
  const { startBulkUpload } = useBulkUpload(projectId);
  const addVideoFiles = useVideoFileRouting(projectId, startBulkUpload);

  const triggerAddVideo = () => openVideoFilePicker(addVideoFiles);

  return { triggerAddVideo, addVideoFiles };
};
