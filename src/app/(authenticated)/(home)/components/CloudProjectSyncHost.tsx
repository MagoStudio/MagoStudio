import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { useCloudProjectSync } from "@domains/scriptProject/useCloudProjectSync";
import { useSelectedShotId } from "@domains/shot/useSelectedShotId";
import { usePathname } from "next/navigation";

export const CloudProjectSyncHost: React.FC = () => {
  const pathname = usePathname();
  const selectedProjectId = useSelectedProjectId();
  const { selectedShotId } = useSelectedShotId();
  const isTimelineEditorPage = pathname === "/project";
  useCloudProjectSync(
    selectedProjectId,
    isTimelineEditorPage ? selectedShotId : undefined
  );
  return null;
};
