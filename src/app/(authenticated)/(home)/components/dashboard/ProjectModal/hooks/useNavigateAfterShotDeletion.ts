import { useProjectShotFolders } from "@domains/project/shotFolders/useProjectShotFolders";
import { useSelectedShotId } from "@domains/shot/useSelectedShotId";
import { useRouter } from "next/navigation";

export const useNavigateAfterShotDeletion = (projectId: string | undefined) => {
  const { data } = useProjectShotFolders(projectId);
  const { selectedShotId, setSelectedShotId } = useSelectedShotId();
  const router = useRouter();

  return (deletedShotIds: Set<string>) => {
    if (!selectedShotId) return;
    if (!deletedShotIds.has(selectedShotId)) return;

    const remainingShotIds = (data?.shotFoldersAndShots ?? [])
      .filter((item) => item.type === "shot" && !deletedShotIds.has(item.id))
      .map((item) => item.id);

    if (remainingShotIds.length > 0) {
      setSelectedShotId(remainingShotIds[0]);
      return;
    }
    router.push("/");
  };
};
