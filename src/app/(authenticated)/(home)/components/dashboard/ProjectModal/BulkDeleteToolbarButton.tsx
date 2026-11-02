import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { useProjectShotFolders } from "@domains/project/shotFolders/useProjectShotFolders";
import { useToast } from "@store/useToast";
import { useTranslation } from "react-i18next";

import { useBulkDeleteShotItems } from "./hooks/useBulkDeleteShotItems";
import { useNavigateAfterShotDeletion } from "./hooks/useNavigateAfterShotDeletion";
import { useShotsSelection } from "./hooks/useShotsSelection";
import { collectShotIdsToDelete } from "./utils/collectShotIdsToDelete";

interface Props {
  projectId: string | undefined;
}

export const BulkDeleteToolbarButton: React.FC<Props> = ({ projectId }) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { selectedIds, count, clear } = useShotsSelection();
  const { bulkDelete, getLeafShotCount, willEmptyProject, isPending } =
    useBulkDeleteShotItems(projectId);
  const { data: shotFoldersData } = useProjectShotFolders(projectId);
  const navigateAfterShotDeletion = useNavigateAfterShotDeletion(projectId);

  const handlePress = () => {
    if (count === 0) return;
    const leafCount = getLeafShotCount(selectedIds);
    const willDeleteProject = willEmptyProject(selectedIds);

    showToast({
      message: t(
        willDeleteProject
          ? "notifications.bulk_delete_shots_and_project.description"
          : "notifications.bulk_delete_shots.description",
        { count: leafCount }
      ),
      onSubmit: async () => {
        const allItems = shotFoldersData?.shotFoldersAndShots ?? [];
        const deletedShotIds = collectShotIdsToDelete(selectedIds, allItems);
        navigateAfterShotDeletion(deletedShotIds);
        await bulkDelete(selectedIds);
        clear();
      },
      onSubmitText: t("actions.delete.label"),
      onCancelText: t("actions.cancel.label"),
      showTimer: false
    });
  };

  return (
    <IconActionButton
      data-testid="bulk-delete-button"
      icon={<Icon iconSet="16" iconName="delete" />}
      size="sm"
      variant="dark"
      isDisabled={count === 0 || isPending}
      onPress={handlePress}
      aria-label={t("actions.bulk_delete_shots.label")}
    />
  );
};
